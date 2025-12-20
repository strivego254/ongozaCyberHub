/**
 * Marketplace Profile Page
 * Public employer view
 */

import { Metadata } from 'next';
import { MarketplaceProfile } from '@/components/ui/portfolio/MarketplaceProfile';
import { getMarketplaceProfile } from '@/lib/portfolio/api';

interface PageProps {
  params: {
    username: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getMarketplaceProfile(params.username);

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  return {
    title: `${profile.headline} - OCH Marketplace`,
    description: profile.bio,
    openGraph: {
      title: `${profile.headline} - OCH Marketplace`,
      description: profile.bio,
      type: 'profile',
      images: profile.avatar ? [profile.avatar] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.headline} - OCH Marketplace`,
      description: profile.bio,
      images: profile.avatar ? [profile.avatar] : [],
    },
  };
}

export default async function MarketplaceProfilePage({ params }: PageProps) {
  const profile = await getMarketplaceProfile(params.username);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Profile Not Found</h1>
          <p className="text-slate-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <MarketplaceProfile profile={profile} username={params.username} />;
}

