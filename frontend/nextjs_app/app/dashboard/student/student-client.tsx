/**
 * Student Dashboard Client
 * Orchestrates the Mission Control interface.
 * The sidebar and navigation are handled by the parent StudentLayout.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fastapiClient } from '@/services/fastapiClient';
import { StudentDashboardHub } from './components/StudentDashboardHub';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

export default function StudentClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [checkingProfiling, setCheckingProfiling] = useState(true);

  useEffect(() => {
    // Only check if user is authenticated
    if (authLoading || !isAuthenticated || !user) {
      return;
    }

    // Check if user is a student/mentee
    const userRoles = user?.roles || [];
    const isStudent = userRoles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase();
      return roleName === 'student' || roleName === 'mentee';
    });

    if (!isStudent) {
      setCheckingProfiling(false);
      return;
    }

    // Check FastAPI profiling status
    const checkProfiling = async () => {
      try {
        const status = await fastapiClient.profiling.checkStatus();
        
        if (!status.completed) {
          console.log('✅ Profiling not completed - redirecting to FastAPI profiling');
          router.push('/onboarding/ai-profiler');
          return;
        }
        
        console.log('✅ Profiling completed');
        setCheckingProfiling(false);
      } catch (error: any) {
        console.error('❌ Failed to check profiling status:', error);
        // On error, allow access but log it
        // This prevents blocking dashboard access if FastAPI is down
        setCheckingProfiling(false);
      }
    };

    checkProfiling();
  }, [user, isAuthenticated, authLoading, router]);

  // Show loading while checking profiling
  if (checkingProfiling && isAuthenticated) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-och-defender animate-spin mx-auto" />
            <div className="text-white text-lg">Checking profiling status...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <StudentDashboardHub />
    </ErrorBoundary>
  );
}
