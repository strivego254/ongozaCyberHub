'use client'

import { TalentScopeView } from '@/components/mentor/TalentScopeView'
import { InfluenceAnalytics } from '@/components/mentor/InfluenceAnalytics'

export default function AnalyticsPage() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Analytics & Performance</h1>
        <p className="text-och-steel">
          Track mentee performance, view TalentScope data, and measure your influence.
        </p>
      </div>

      <div className="space-y-6">
        <InfluenceAnalytics />
        <TalentScopeView />
      </div>
    </div>
  )
}


