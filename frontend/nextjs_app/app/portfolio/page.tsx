/**
 * Portfolio Dashboard Page
 * Main portfolio management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortfolioDashboard } from '@/components/ui/portfolio/PortfolioDashboard';
import { PortfolioSidebar } from '@/components/ui/portfolio/PortfolioSidebar';
import { PortfolioItemForm } from '@/components/ui/portfolio/PortfolioItemForm';

export default function PortfolioPage() {
  const searchParams = useSearchParams();
  const [showNewItemForm, setShowNewItemForm] = useState(false);

  useEffect(() => {
    // Check if ?new=true query parameter is present
    const isNew = searchParams?.get('new') === 'true';
    setShowNewItemForm(isNew);
  }, [searchParams]);

  const handleNavigate = (section: string) => {
    // Handle navigation to different sections
    if (section === 'filters') {
      // Scroll to filters or open filter panel
      const element = document.getElementById('portfolio-filters');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (section === 'preview') {
      // Open preview modal
      const fab = document.querySelector('[aria-label="Preview as employer"]');
      if (fab) {
        (fab as HTMLElement).click();
      }
    }
  };

  const handleCloseForm = () => {
    setShowNewItemForm(false);
    // Remove query parameter from URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('new');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="relative min-h-screen">
      <PortfolioSidebar onNavigate={handleNavigate} />
      <PortfolioDashboard />
      {showNewItemForm && (
        <PortfolioItemForm
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

