'use client'

import { Card } from '@/components/ui/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { useDashboardStore } from '../../lib/store/dashboardStore'

const COLORS = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  draft: '#64748b',
}

export function PortfolioCard() {
  const { portfolio } = useDashboardStore()

  const data = [
    { name: 'Approved', value: portfolio.approved, color: COLORS.approved },
    { name: 'Pending', value: portfolio.pending, color: COLORS.pending },
    { name: 'Rejected', value: portfolio.rejected, color: COLORS.rejected },
  ].filter(item => item.value > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="glass-card p-3 md:p-4 hover:glass-hover transition-all">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-och-steel">Portfolio</h3>
          <span className="text-[10px] text-dashboard-accent font-medium">
            {Math.round(portfolio.percentage)}%
          </span>
        </div>

        <div className="h-20 mb-2">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  iconType="circle"
                  formatter={(value) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-och-steel text-xs">
              No portfolio items
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 text-[10px]">
          <div className="text-center">
            <div className="text-white font-semibold">{portfolio.approved}</div>
            <div className="text-och-steel">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">{portfolio.pending}</div>
            <div className="text-och-steel">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">{portfolio.total}</div>
            <div className="text-och-steel">Total</div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

