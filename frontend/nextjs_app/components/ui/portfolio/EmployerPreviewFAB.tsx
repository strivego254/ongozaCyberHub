/**
 * Employer Preview FAB (Floating Action Button)
 * Quick access to preview mode
 */

'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { EmployerPreviewModal } from './EmployerPreviewModal';
import { useMarketplaceProfile } from '@/hooks/useMarketplaceProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { createClient } from '@/lib/supabase/client';

export function EmployerPreviewFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, [supabase]);

  const { profile } = useMarketplaceProfile(userId);
  const { items } = usePortfolio(userId);

  if (!profile || !userId) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-2xl hover:shadow-indigo-500/50 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 group"
        aria-label="Preview as employer"
      >
        <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      <EmployerPreviewModal
        profile={profile}
        items={items}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
