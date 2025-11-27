/**
 * SSO Provider Buttons Component
 * Displays sign-in buttons for Google, Microsoft, Apple, and Okta
 */

'use client';

import { useState } from 'react';
import { djangoClient } from '@/services/djangoClient';

interface SSOProvider {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  bgColor: string;
}

const SSO_PROVIDERS: SSOProvider[] = [
  {
    name: 'google',
    displayName: 'Google',
    icon: '🔵',
    color: 'text-white',
    bgColor: 'bg-[#4285F4] hover:bg-[#357AE5]',
  },
  {
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: '🪟',
    color: 'text-white',
    bgColor: 'bg-[#00A4EF] hover:bg-[#0088CC]',
  },
  {
    name: 'apple',
    displayName: 'Apple',
    icon: '🍎',
    color: 'text-white',
    bgColor: 'bg-black hover:bg-gray-800',
  },
  {
    name: 'okta',
    displayName: 'Okta',
    icon: '🔐',
    color: 'text-white',
    bgColor: 'bg-[#007DC1] hover:bg-[#0066A0]',
  },
];

interface SSOButtonsProps {
  mode?: 'signup' | 'login';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function SSOButtons({ mode = 'login', onSuccess, onError }: SSOButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSSO = async (provider: string) => {
    setLoading(provider);
    
    try {
      // Generate device fingerprint
      const deviceFingerprint = `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const deviceName = navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser';

      // For production, you would:
      // 1. Redirect to provider's OAuth authorization endpoint
      // 2. Handle callback with authorization code
      // 3. Exchange code for tokens
      // 4. Call SSO endpoint with id_token
      
      // For now, this is a placeholder that shows the flow
      // In production, implement OAuth2 flow with PKCE
      const response = await djangoClient.auth.ssoLogin(provider, {
        id_token: 'PLACEHOLDER_ID_TOKEN', // In production, get from OAuth flow
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
      });

      if (response.access_token) {
        // Store tokens
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || error.detail || `Failed to sign in with ${provider}`;
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-steel-grey"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-och-midnight text-steel-grey">
            {mode === 'signup' ? 'Or sign up with' : 'Or sign in with'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SSO_PROVIDERS.map((provider) => (
          <button
            key={provider.name}
            type="button"
            onClick={() => handleSSO(provider.name)}
            disabled={loading !== null}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-card
              ${provider.bgColor} ${provider.color}
              font-medium text-body-s
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-cyber-mint focus:ring-offset-2 focus:ring-offset-och-midnight
            `}
          >
            {loading === provider.name ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span className="text-lg">{provider.icon}</span>
                <span>{provider.displayName}</span>
              </>
            )}
          </button>
        ))}
      </div>

      <p className="text-body-xs text-steel-grey text-center mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy.
        {mode === 'signup' && ' New users will be assigned the Mentee role by default.'}
      </p>
    </div>
  );
}



