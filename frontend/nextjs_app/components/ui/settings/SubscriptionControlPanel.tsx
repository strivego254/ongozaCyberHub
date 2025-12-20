/**
 * Subscription Control Panel Component
 * Modern feature grid with upgrade CTAs
 */

'use client';

import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { checkFeatureAccess, getUpgradeRecommendations } from '@/lib/settings/entitlements';
import type { UserEntitlements, UserSettings } from '@/lib/settings/types';

interface SubscriptionControlPanelProps {
  entitlements: UserEntitlements | null;
  settings: UserSettings | null;
}

export function SubscriptionControlPanel({ entitlements, settings }: SubscriptionControlPanelProps) {
  if (!entitlements || !settings) return null;

  const recommendations = getUpgradeRecommendations(entitlements, settings);
  const marketplaceAccess = checkFeatureAccess(entitlements, settings, 'marketplace_full');
  const aiCoachAccess = checkFeatureAccess(entitlements, settings, 'ai_coach_full');
  const mentorAccess = checkFeatureAccess(entitlements, settings, 'mentor_access');
  const portfolioExport = checkFeatureAccess(entitlements, settings, 'portfolio_export');

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      priceLabel: 'Free forever',
      features: [
        { name: 'Basic portfolio', included: true },
        { name: 'Limited AI Coach (5 messages/day)', included: true },
        { name: 'Community access', included: true },
        { name: 'Mentor reviews', included: false },
        { name: 'Portfolio export', included: false },
        { name: 'Marketplace contact', included: false },
        { name: 'Unlimited AI Coach', included: false },
        { name: 'Priority support', included: false },
      ],
      current: entitlements.tier === 'free',
    },
    {
      name: 'Starter',
      price: '$29',
      priceLabel: 'per month',
      features: [
        { name: 'Everything in Free', included: true },
        { name: 'Mentor access', included: true },
        { name: 'Portfolio export', included: true },
        { name: 'Enhanced AI Coach (20 messages/day)', included: true },
        { name: 'Marketplace contact', included: false },
        { name: 'Unlimited AI Coach', included: false },
        { name: 'Priority support', included: false },
      ],
      current: entitlements.tier === 'starter',
    },
    {
      name: 'Professional',
      price: '$99',
      priceLabel: 'per month',
      features: [
        { name: 'Everything in Starter', included: true },
        { name: 'Full marketplace access', included: true },
        { name: 'Unlimited AI Coach', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom habits', included: true },
      ],
      current: entitlements.tier === 'professional',
    },
  ];

  const currentTier = tiers.find(t => t.current) || tiers[0];
  const canUpgrade = entitlements.tier !== 'professional';

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Subscription</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your plan and feature access
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-slate-400 mb-1">Current Plan</div>
                <div className="text-2xl font-bold text-slate-100 capitalize">
                  {entitlements.tier}
                </div>
                <div className="text-sm text-slate-500 mt-1">{currentTier.priceLabel}</div>
              </div>
              <Badge
                variant={entitlements.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                className="bg-gradient-to-r from-indigo-500 to-purple-500"
              >
                {entitlements.subscriptionStatus}
              </Badge>
            </div>
          {entitlements.enhancedAccessUntil && (
            <div className="text-xs text-amber-400 mt-2">
              Enhanced access until {new Date(entitlements.enhancedAccessUntil).toLocaleDateString()}
            </div>
          )}
          {entitlements.nextBillingDate && (
            <div className="text-xs text-slate-400 mt-2">
              Next billing: {new Date(entitlements.nextBillingDate).toLocaleDateString()}
            </div>
          )}
          </div>

          {/* Feature Access Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Unlocked Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                marketplaceAccess.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">Marketplace Full Access</div>
                  <div className="text-xs text-slate-500">{marketplaceAccess.reason}</div>
                </div>
                {marketplaceAccess.enabled ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                aiCoachAccess.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">AI Coach Full Access</div>
                  <div className="text-xs text-slate-500">{aiCoachAccess.reason}</div>
                </div>
                {aiCoachAccess.enabled ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                mentorAccess.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">Mentor Access</div>
                  <div className="text-xs text-slate-500">Get mentor reviews and feedback</div>
                </div>
                {mentorAccess.enabled ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                portfolioExport.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">Portfolio Export</div>
                  <div className="text-xs text-slate-500">Download portfolio as PDF/JSON</div>
                </div>
                {portfolioExport.enabled ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                entitlements.missionAccess === 'full' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">Mission Access</div>
                  <div className="text-xs text-slate-500">
                    {entitlements.missionAccess === 'full' ? 'Full access to all missions' : 'Basic mission access'}
                  </div>
                </div>
                {entitlements.missionAccess === 'full' ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              {entitlements.portfolioCapabilities && entitlements.portfolioCapabilities.length > 0 && (
                <div className="p-3 rounded-lg border bg-indigo-500/10 border-indigo-500/30">
                  <div className="text-sm font-medium text-slate-200 mb-2">Portfolio Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {entitlements.portfolioCapabilities.map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-indigo-500/20 text-indigo-400">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade CTA */}
          {canUpgrade && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 rounded-xl p-6 text-center"
            >
              <h3 className="text-lg font-bold text-slate-100 mb-2">Upgrade to Professional</h3>
              <p className="text-sm text-slate-400 mb-4">
                Unlock full marketplace access, unlimited AI Coach, and priority support
              </p>
              <div className="flex gap-3">
                <Button
                  variant="defender"
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  onClick={() => {
                    // Open billing portal (Stripe/Paystack)
                    window.open('/api/billing/portal', '_blank');
                  }}
                >
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    // Open billing portal for current plan management
                    window.open('/api/billing/portal', '_blank');
                  }}
                >
                  Manage Billing
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Tier Comparison */}
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier.current
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-100">{tier.name}</div>
                    <div className="text-sm text-slate-400">{tier.price} {tier.priceLabel}</div>
                  </div>
                  {tier.current && (
                    <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                      Current
                    </Badge>
                  )}
                </div>
                <ul className="space-y-2 mb-4">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-slate-600 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                {!tier.current && (
                  <Button variant="outline" size="sm" className="w-full">
                    {tier.name === 'Professional' ? 'Upgrade' : 'Switch Plan'}
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Upgrade Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-amber-500/10 border border-amber-500/30 glass-card-hover">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-amber-400 mb-2">Upgrade Recommendations</h3>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
