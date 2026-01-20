'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import SSOButtons from '@/components/SSOButtons';
import { getRedirectRoute } from '@/utils/redirect';
import { Eye, EyeOff, Shield, ArrowRight, Sparkles, Lock, Mail } from 'lucide-react';
import type { LoginRequest } from '@/services/types';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { motion } from 'framer-motion';

const PERSONAS = {
  student: { 
    name: 'Student', 
    icon: '🎓', 
    color: 'defender-blue', 
    description: 'Begin your cyber defense journey',
    gradient: 'from-och-defender/20 via-och-mint/10 to-och-defender/20'
  },
  mentor: { 
    name: 'Mentor', 
    icon: '👨‍🏫', 
    color: 'sahara-gold', 
    description: 'Guide the next generation',
    gradient: 'from-och-gold/20 via-och-mint/10 to-och-gold/20'
  },
  admin: { 
    name: 'Admin', 
    icon: '⚡', 
    color: 'sahara-gold', 
    description: 'Full platform access',
    gradient: 'from-och-gold/20 via-och-orange/10 to-och-gold/20'
  },
  director: { 
    name: 'Program Director', 
    icon: '👔', 
    color: 'sahara-gold', 
    description: 'Manage programs and operations',
    gradient: 'from-och-gold/20 via-och-mint/10 to-och-gold/20'
  },
  sponsor: { 
    name: 'Sponsor/Employer', 
    icon: '💼', 
    color: 'sahara-gold', 
    description: 'Support talent development',
    gradient: 'from-och-gold/20 via-och-mint/10 to-och-gold/20'
  },
  analyst: { 
    name: 'Analyst', 
    icon: '📊', 
    color: 'defender-blue', 
    description: 'Access analytics and insights',
    gradient: 'from-och-defender/20 via-och-mint/10 to-och-defender/20'
  },
  finance: { 
    name: 'Finance', 
    icon: '💰', 
    color: 'defender-blue', 
    description: 'Manage billing and revenue operations',
    gradient: 'from-och-defender/20 via-och-mint/10 to-och-defender/20'
  },
};

const VALID_ROLES = Object.keys(PERSONAS);

function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roleParam = params?.role as string;
  const urlRole = roleParam && VALID_ROLES.includes(roleParam) ? roleParam : 'student';
  
  const [currentRole, setCurrentRole] = useState(urlRole);
  const role = currentRole;
  
  useEffect(() => {
    if (urlRole !== currentRole) {
      setCurrentRole(urlRole);
    }
  }, [urlRole, currentRole]);
  
  const { login, isLoading, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    device_fingerprint: 'web-' + Date.now(),
    device_name: 'Web Browser',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasRedirectedRef = useRef(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('remembered_email');
      const savedRememberMe = localStorage.getItem('remember_me') === 'true';
      if (savedEmail && savedRememberMe) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    }
  }, []);

  useEffect(() => {
    if (role && !VALID_ROLES.includes(role)) {
      router.push('/login/student');
    }
  }, [role, router]);

  useEffect(() => {
    if (hasRedirectedRef.current) return;
    if (isLoggingIn || isRedirecting) return;
    if (isLoading) return;
    
    if (isAuthenticated && user) {
      const redirectTo = searchParams.get('redirect');
      if (redirectTo && redirectTo.startsWith('/dashboard')) {
        hasRedirectedRef.current = true;
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, user, isLoading, isLoggingIn, isRedirecting, router, searchParams]);

  const currentPersona = PERSONAS[role as keyof typeof PERSONAS] || PERSONAS.student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    setIsRedirecting(false);

    try {
      if (rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('remembered_email', formData.email);
        localStorage.setItem('remember_me', 'true');
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }

      const result = await login(formData);
      
      if (!result || !result.user) {
        throw new Error('Login failed: No user data received');
      }

      const token = result.access_token || localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      localStorage.setItem('access_token', token);

      const userRoles = result?.user?.roles || []
      const isStudent = userRoles.some((r: any) => {
        const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase()
        return roleName === 'student' || roleName === 'mentee'
      })

      if (isStudent) {
        try {
          const { fastapiClient } = await import('@/services/fastapiClient')
          const fastapiStatus = await fastapiClient.profiling.checkStatus()
          
          if (!fastapiStatus.completed) {
            setIsRedirecting(true)
            hasRedirectedRef.current = true
            window.location.href = '/onboarding/ai-profiler'
            return
          }
        } catch (fastapiError: any) {
          if ((result as any)?.profiling_required) {
            setIsRedirecting(true)
            hasRedirectedRef.current = true
            window.location.href = '/onboarding/ai-profiler'
            return
          }
        }
      } else if ((result as any)?.profiling_required) {
        setIsRedirecting(true)
        hasRedirectedRef.current = true
        router.push('/profiling')
        return
      }

      const redirectTo = searchParams.get('redirect');
      let route: string = '/dashboard/student';

      await new Promise(resolve => setTimeout(resolve, 500));
      
      let updatedUser = result?.user || user;
      
      let retries = 0;
      while ((!updatedUser || !updatedUser.roles || updatedUser.roles.length === 0) && retries < 5) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updatedUser = user || result?.user;
        retries++;
      }
      
      let dashboardFromCookie: string | null = null;
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const dashboardCookie = cookies.find(c => c.trim().startsWith('och_dashboard='));
        if (dashboardCookie) {
          dashboardFromCookie = dashboardCookie.split('=')[1]?.trim() || null;
        }
      }
      
      if (redirectTo && (redirectTo.startsWith('/dashboard') || redirectTo.startsWith('/students/'))) {
        route = redirectTo;
      } else {
        if (!updatedUser || !updatedUser.roles || updatedUser.roles.length === 0) {
          if (dashboardFromCookie) {
            route = dashboardFromCookie;
          } else {
            route = '/dashboard/student';
          }
        } else {
          const userRoles = updatedUser.roles || [];
          
          if (role === 'director') {
            const isAdmin = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              return roleName?.toLowerCase().trim() === 'admin'
            })
            const isProgramDirector = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              const normalized = roleName?.toLowerCase().trim()
              return normalized === 'program_director' || normalized === 'program director' || normalized === 'director'
            })
            
            if (!isAdmin && !isProgramDirector) {
              setError('You do not have permission to access the Program Director dashboard. Your account must have program_director or admin role.');
              setIsLoggingIn(false);
              return;
            }
          } else if (role === 'mentor') {
            const isMentor = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              return roleName?.toLowerCase().trim() === 'mentor'
            })
            const isAdmin = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              return roleName?.toLowerCase().trim() === 'admin'
            })
            
            if (!isMentor && !isAdmin) {
              setError('You do not have permission to access the Mentor dashboard. Your account must have mentor or admin role.');
              setIsLoggingIn(false);
              return;
            }
          } else if (role === 'admin') {
            const isAdmin = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              return roleName?.toLowerCase().trim() === 'admin'
            })
            
            if (!isAdmin) {
              setError('You do not have permission to access the Admin dashboard. Your account must have admin role.');
              setIsLoggingIn(false);
              return;
            }
          } else if (role === 'finance') {
            const isFinance = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              const normalized = roleName?.toLowerCase().trim()
              return normalized === 'finance' || normalized === 'finance_admin'
            })
            const isAdmin = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              return roleName?.toLowerCase().trim() === 'admin'
            })
            
            if (!isFinance && !isAdmin) {
              setError('You do not have permission to access the Finance dashboard. Your account must have finance or finance_admin role.');
              setIsLoggingIn(false);
              return;
            }
          }

          const isAdmin = userRoles.some((ur: any) => {
            const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
            return roleName?.toLowerCase().trim() === 'admin'
          })
          
          if (isAdmin) {
            route = '/dashboard/admin'
          } else {
            route = getRedirectRoute(updatedUser);
            
            const isProgramDirector = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              const normalized = roleName?.toLowerCase().trim()
              return normalized === 'program_director' || normalized === 'program director' || normalized === 'director'
            })
            
            if (isProgramDirector) {
              route = '/dashboard/director'
            }
            
            const isFinance = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              const normalized = roleName?.toLowerCase().trim()
              return normalized === 'finance' || normalized === 'finance_admin'
            })
            
            if (isFinance) {
              route = '/dashboard/finance'
            }
          }
        }
      }

      if (!route || (!route.startsWith('/dashboard') && !route.startsWith('/students/'))) {
        route = '/dashboard/student';
      }

      setIsRedirecting(true);
      hasRedirectedRef.current = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = route;

    } catch (err: any) {
      setIsLoggingIn(false);
      setIsRedirecting(false);
      
      let message = 'Login failed. Please check your credentials.';

      if (err?.mfa_required) {
        message = 'Multi-factor authentication is required. Please contact support to set up MFA.';
      } else if (err?.data?.detail) {
        message = err.data.detail;
      } else if (err?.data?.error) {
        message = err.data.error;
      } else if (err?.detail) {
        message = err.detail;
      } else if (err?.message) {
        message = err.message;
        if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ECONNREFUSED')) {
          message = 'Cannot connect to backend server. Please ensure the Django API is running on port 8000.';
        }
      }

      setError(message);
    }
  };

  const switchRole = (newRole: string) => {
    if (newRole === currentRole) {
      return;
    }
    
    setCurrentRole(newRole);
    const redirectTo = searchParams.get('redirect');
    let newUrl = `/login/${newRole}`;
    if (redirectTo) {
      newUrl += `?redirect=${encodeURIComponent(redirectTo)}`;
    }
    router.replace(newUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-slate-950 to-och-midnight flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br ${currentPersona.gradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br ${currentPersona.gradient} rounded-full blur-3xl opacity-20 animate-pulse delay-1000`} />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-8 items-center"
        >
          {/* Left Side - Hero Section */}
          <div className="hidden md:block space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-och-defender to-och-mint/20 rounded-xl">
                  <Shield className="w-8 h-8 text-och-mint" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    Ongoza CyberHub
                  </h1>
                  <p className="text-och-steel text-sm">Elite Cybersecurity Training</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-och-defender/10 to-och-mint/5 border border-och-defender/20 rounded-xl">
                  <div className="p-2 bg-och-defender/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-och-mint" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI-Powered Learning</h3>
                    <p className="text-och-steel text-sm">Personalized pathways matched to your goals</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-och-defender/10 to-och-mint/5 border border-och-defender/20 rounded-xl">
                  <div className="p-2 bg-och-mint/20 rounded-lg">
                    <Lock className="w-5 h-5 text-och-mint" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Real-World Missions</h3>
                    <p className="text-och-steel text-sm">Hands-on experience with industry tools</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-och-defender/10 to-och-mint/5 border border-och-defender/20 rounded-xl">
                  <div className="p-2 bg-och-gold/20 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-och-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Career Ready</h3>
                    <p className="text-och-steel text-sm">Build your portfolio and land your dream role</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <Card className="p-8 shadow-2xl border border-och-defender/30 bg-och-midnight/95 backdrop-blur-sm">
              {/* Mobile Header */}
              <div className="md:hidden text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-och-defender to-och-mint/20 rounded-lg">
                    <Shield className="w-6 h-6 text-och-mint" />
                  </div>
                  <h1 className="text-2xl font-black text-white">Ongoza CyberHub</h1>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${currentPersona.gradient} border border-och-steel/30`}>
                  <span className="text-lg">{currentPersona.icon}</span>
                  <span className="text-sm font-medium text-och-steel">{currentPersona.name} Portal</span>
                </div>
              </div>

              {/* Desktop Role Badge */}
              <div className="hidden md:flex items-center justify-between mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${currentPersona.gradient} border border-och-steel/30`}>
                  <span className="text-lg">{currentPersona.icon}</span>
                  <span className="text-sm font-medium text-och-steel">{currentPersona.name} Portal</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-och-steel text-sm mb-6">Sign in to continue your cybersecurity journey</p>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg"
                  role="alert"
                >
                  <p className="text-och-orange text-sm flex items-center gap-2">
                    <span className="font-semibold">⚠️</span>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Success/Redirecting Message */}
              {isRedirecting && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 bg-och-mint/10 border border-och-mint/30 rounded-lg"
                  role="status"
                >
                  <div className="flex items-center gap-2 text-och-mint text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-och-mint border-t-transparent rounded-full"></div>
                    <span>Login successful! Redirecting to your dashboard...</span>
                  </div>
                </motion.div>
              )}

              {/* Google Sign-In Button */}
              <div className="mb-6">
                <GoogleSignInButton role={role} />
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-och-steel/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-och-midnight text-och-steel">or continue with email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-och-steel flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-och-midnight border border-och-steel/30 focus:border-och-mint focus:ring-2 focus:ring-och-mint/20 transition-all text-white placeholder-och-steel/50"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-och-steel flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-och-midnight border border-och-steel/30 focus:border-och-mint focus:ring-2 focus:ring-och-mint/20 transition-all text-white placeholder-och-steel/50"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-och-steel hover:text-och-mint transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-och-steel/30 bg-och-midnight text-och-mint focus:ring-och-mint focus:ring-offset-0 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm text-och-steel group-hover:text-och-mint transition-colors">
                      Remember me
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-sm text-och-mint hover:text-och-mint/80 transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || isLoggingIn || isRedirecting}
                  variant="defender"
                  className="w-full py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-och-defender/20 transition-all"
                >
                  {isRedirecting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Redirecting...
                    </span>
                  ) : isLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 pt-6 border-t border-och-steel/20">
                <p className="text-center text-sm text-och-steel mb-3">
                  Don't have an account?
                </p>
                <Button
                  variant="outline"
                  className="w-full py-3 text-base rounded-lg border-och-steel/30 hover:border-och-mint hover:text-och-mint transition-all"
                  onClick={() => router.push(`/signup/${role}`)}
                >
                  Create Account
                </Button>
              </div>

              {/* Role Switching - Compact */}
              <div className="mt-6 pt-6 border-t border-och-steel/20">
                <p className="text-xs text-och-steel/70 mb-3 text-center">Switch Role:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(PERSONAS).map(([key, { name, icon }]) => (
                    <button
                      key={key}
                      onClick={() => switchRole(key)}
                      className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${
                        role === key
                          ? 'border-och-mint text-och-mint bg-och-mint/10 shadow-lg shadow-och-mint/20'
                          : 'border-och-steel/30 text-och-steel hover:border-och-mint/50 hover:text-och-mint/80 bg-och-midnight'
                      }`}
                    >
                      {icon} {name}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RoleLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-och-steel">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
