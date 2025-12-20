/**
 * Marketplace Profile Component
 * Clean employer view - hiring manager perspective
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { User, Mail, Share2, Linkedin, Twitter, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PortfolioItemCard } from './PortfolioItemCard';
import { PortfolioSkillsHeatmap } from './PortfolioSkillsHeatmap';
import { useMarketplace } from '@/hooks/useMarketplace';
import type { MarketplaceProfile as MarketplaceProfileType } from '@/lib/portfolio/types';

interface MarketplaceProfileProps {
  profile: MarketplaceProfileType;
  username: string;
}

export function MarketplaceProfile({ profile, username }: MarketplaceProfileProps) {
  // Track view
  useMarketplace(username, true);

  const handleShare = (platform: 'linkedin' | 'twitter') => {
    const url = window.location.href;
    const text = `Check out ${profile.headline}'s portfolio on OCH Marketplace`;
    
    if (platform === 'linkedin') {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        '_blank'
      );
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank'
      );
    }
  };

  const handleContact = () => {
    if (profile.isContactEnabled) {
      window.location.href = `mailto:${username}@ongozacyberhub.com?subject=Portfolio Inquiry`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 lg:px-10 lg:py-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-card glass-card-hover mb-10">
          <div className="p-8 lg:p-12 text-center">
            <div className="inline-block relative mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-indigo-500/50 bg-slate-800 flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.headline}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full w-14 h-14 flex items-center justify-center border-4 border-slate-900 font-bold text-lg">
                {profile.readinessScore}%
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-slate-50 mb-4">
              {profile.headline}
            </h1>
            
            <p className="text-xl text-slate-300 mb-6 max-w-2xl mx-auto">
              {profile.bio}
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Badge
                variant="secondary"
                className={`text-lg px-6 py-2 capitalize ${
                  profile.profileStatus === 'job_ready' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : profile.profileStatus === 'emerging'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'bg-slate-600/20 text-slate-400 border-slate-600/50'
                }`}
              >
                {profile.profileStatus.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-2">
                {profile.featuredItems.length} Featured Projects
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-2">
                Portfolio Health: {profile.portfolioHealth.toFixed(1)}/10
              </Badge>
            </div>

            {profile.isContactEnabled ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg px-12 py-8 font-bold shadow-2xl"
                onClick={handleContact}
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact for Opportunities
              </Button>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Contact not enabled by this candidate
              </p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Featured Items */}
      {profile.featuredItems.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-slate-100 mb-6 text-center">Featured Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.featuredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              >
                <PortfolioItemCard item={item} marketplaceView />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Skills Heatmap */}
      {profile.skills && profile.skills.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="glass-card glass-card-hover">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">Skills Mastery</h2>
              <PortfolioSkillsHeatmap topSkills={profile.skills} />
            </div>
          </Card>
        </motion.section>
      )}
    </div>
  );
}
