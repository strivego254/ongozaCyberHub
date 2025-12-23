/**
 * Employer Preview FAB (Floating Action Button)
 * EXACT SPEC: [👁️ Preview] [📄 Export] [➕ New]
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, FileDown, Plus } from 'lucide-react';
import { EmployerPreviewModal } from './EmployerPreviewModal';
import { PortfolioExporter } from './PortfolioExporter';
import { useMarketplaceProfile } from '@/hooks/useMarketplaceProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';

export function EmployerPreviewFAB() {
  const router = useRouter();
  const { user } = useAuth();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const userId = user?.id;

  const { profile } = useMarketplaceProfile(userId);
  const { items } = usePortfolio(userId);

  if (!userId) return null;

  return (
    <>
      {/* FAB Container - EXACT SPEC */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
        {/* Preview Button */}
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-2xl hover:shadow-indigo-500/50 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 group"
          aria-label="Preview as employer"
          title="Preview as Employer"
        >
          <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        {/* Export Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 group"
          aria-label="Export portfolio"
          title="Export Portfolio"
        >
          <FileDown className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        {/* New Item Button */}
        <button
          onClick={() => router.push('/dashboard/student/portfolio?new=true')}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-2xl hover:shadow-amber-500/50 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 group"
          aria-label="Create new portfolio item"
          title="New Portfolio Item"
        >
          <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Modals */}
      {profile && (
        <EmployerPreviewModal
          profile={profile}
          items={items}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      <PortfolioExporter
        items={items}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </>
  );
}
