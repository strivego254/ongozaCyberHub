'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface SubscriptionPlan {
  id: string
  name: string
  tier: 'free' | 'starter' | 'premium'
  price_monthly: number | null
  ai_coach_daily_limit: number | null
  portfolio_item_limit: number | null
  missions_access_type: 'none' | 'ai_only' | 'full'
  mentorship_access: boolean
  talentscope_access: 'none' | 'basic' | 'preview' | 'full'
  marketplace_contact: boolean
  enhanced_access_days: number | null
  features: string[]
}

export default function PlansManagementClient() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setIsLoading(true)
      const response = await apiGateway.get('/api/v1/subscriptions/admin/plans/')
      setPlans(response.data)
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (planData: Partial<SubscriptionPlan>) => {
    try {
      if (editingPlan?.id) {
        await apiGateway.put(`/api/v1/subscriptions/admin/plans/${editingPlan.id}/`, planData)
      } else {
        await apiGateway.post('/api/v1/subscriptions/admin/plans/', planData)
      }
      await loadPlans()
      setIsModalOpen(false)
      setEditingPlan(null)
    } catch (error) {
      console.error('Failed to save plan:', error)
      alert('Failed to save plan. Please check the console for details.')
    }
  }

  const tierConfig = {
    free: { label: 'Free Tier', color: 'steel' },
    starter: { label: 'Starter Tier ($3/month)', color: 'defender' },
    premium: { label: 'Premium Tier ($7/month)', color: 'mint' },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-och-steel">Loading plans...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-och-defender">Subscription Plans</h1>
          <p className="text-och-steel">Configure the three-tier subscription system</p>
        </div>
        <Button
          variant="defender"
          onClick={() => {
            setEditingPlan(null)
            setIsModalOpen(true)
          }}
        >
          + Create Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const config = tierConfig[plan.tier]
          return (
            <Card key={plan.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant={config.color as any}>{config.label}</Badge>
                  <h3 className="text-xl font-bold text-white mt-2">{plan.name}</h3>
                  {plan.price_monthly && (
                    <p className="text-och-defender text-lg font-semibold mt-1">
                      ${plan.price_monthly}/month
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPlan(plan)
                    setIsModalOpen(true)
                  }}
                >
                  Edit
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-och-steel">Missions:</span>
                  <span className="text-white ml-2 capitalize">{plan.missions_access_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-och-steel">Mentorship:</span>
                  <span className="text-white ml-2">{plan.mentorship_access ? 'Full Access' : 'No Access'}</span>
                </div>
                <div>
                  <span className="text-och-steel">TalentScope:</span>
                  <span className="text-white ml-2 capitalize">{plan.talentscope_access}</span>
                </div>
                <div>
                  <span className="text-och-steel">Marketplace:</span>
                  <span className="text-white ml-2">{plan.marketplace_contact ? 'Enabled' : 'Disabled'}</span>
                </div>
                {plan.ai_coach_daily_limit !== null && (
                  <div>
                    <span className="text-och-steel">AI Coach:</span>
                    <span className="text-white ml-2">{plan.ai_coach_daily_limit} interactions/day</span>
                  </div>
                )}
                {plan.portfolio_item_limit !== null && (
                  <div>
                    <span className="text-och-steel">Portfolio:</span>
                    <span className="text-white ml-2">{plan.portfolio_item_limit} items</span>
                  </div>
                )}
                {plan.enhanced_access_days && (
                  <div>
                    <span className="text-och-steel">Enhanced Access:</span>
                    <span className="text-white ml-2">{plan.enhanced_access_days} days</span>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {isModalOpen && (
        <PlanEditModal
          plan={editingPlan}
          onClose={() => {
            setIsModalOpen(false)
            setEditingPlan(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function PlanEditModal({
  plan,
  onClose,
  onSave,
}: {
  plan: SubscriptionPlan | null
  onSave: (data: Partial<SubscriptionPlan>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: plan?.name || '',
    tier: plan?.tier || 'free',
    price_monthly: plan?.price_monthly || null,
    ai_coach_daily_limit: plan?.ai_coach_daily_limit || null,
    portfolio_item_limit: plan?.portfolio_item_limit || null,
    missions_access_type: plan?.missions_access_type || 'none',
    mentorship_access: plan?.mentorship_access || false,
    talentscope_access: plan?.talentscope_access || 'none',
    marketplace_contact: plan?.marketplace_contact || false,
    enhanced_access_days: plan?.enhanced_access_days || null,
    features: plan?.features || [],
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {plan ? 'Edit Plan' : 'Create Plan'}
            </h2>
            <button
              onClick={onClose}
              className="text-och-steel hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                placeholder="e.g., free, starter, premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
              >
                <option value="free">Free Tier</option>
                <option value="starter">Starter Tier ($3/month)</option>
                <option value="premium">Premium Tier ($7/month)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Monthly Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_monthly || ''}
                onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">AI Coach Daily Limit</label>
                <input
                  type="number"
                  value={formData.ai_coach_daily_limit || ''}
                  onChange={(e) => setFormData({ ...formData, ai_coach_daily_limit: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Portfolio Item Limit</label>
                <input
                  type="number"
                  value={formData.portfolio_item_limit || ''}
                  onChange={(e) => setFormData({ ...formData, portfolio_item_limit: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Missions Access Type</label>
              <select
                value={formData.missions_access_type}
                onChange={(e) => setFormData({ ...formData, missions_access_type: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
              >
                <option value="none">No Missions</option>
                <option value="ai_only">AI-Only Missions</option>
                <option value="full">Full Missions (including Capstones and Labs)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">TalentScope Access</label>
              <select
                value={formData.talentscope_access}
                onChange={(e) => setFormData({ ...formData, talentscope_access: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
              >
                <option value="none">No Access</option>
                <option value="basic">Basic TalentScope</option>
                <option value="preview">Preview Mode</option>
                <option value="full">Full Analytics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Enhanced Access Days</label>
              <input
                type="number"
                value={formData.enhanced_access_days || ''}
                onChange={(e) => setFormData({ ...formData, enhanced_access_days: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                placeholder="e.g., 180 for Starter tier"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.mentorship_access}
                  onChange={(e) => setFormData({ ...formData, mentorship_access: e.target.checked })}
                  className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                />
                <span className="text-white">Mentorship Access</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.marketplace_contact}
                  onChange={(e) => setFormData({ ...formData, marketplace_contact: e.target.checked })}
                  className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                />
                <span className="text-white">Marketplace Contact</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="defender"
                onClick={() => onSave(formData)}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}









