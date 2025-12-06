'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { BadgesDisplay } from '@/components/gamification/BadgesDisplay'

export default function CoachingPage() {
  const habits: any[] = []
  const goals: any[] = []

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Coaching</h1>
          <p className="text-och-steel">
            Habits, goals, reflections — coaching OS core surfaces
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Habits</h2>
            <div className="space-y-4">
              {habits.length === 0 ? (
                <div className="text-center py-8 text-och-steel">
                  <p>No habits yet. Create your first habit to get started.</p>
                </div>
              ) : (
                habits.map((habit) => (
                  <div key={habit.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-white">{habit.name}</span>
                      <span className="text-sm text-och-steel">🔥 {habit.streak} day streak</span>
                    </div>
                    <ProgressBar value={habit.progress} variant="defender" />
                    <div className="text-xs text-och-steel mt-1">
                      {habit.streak} / {habit.target} days
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">Add New Habit</Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Goals</h2>
            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-8 text-och-steel">
                  <p>No goals yet. Set your first goal to track your progress.</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className="p-4 bg-och-midnight/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium text-white">{goal.title}</h3>
                      <span className="text-sm text-och-steel">{goal.progress}%</span>
                    </div>
                    <ProgressBar value={goal.progress} variant="mint" />
                    <div className="text-xs text-och-steel mt-2">
                      Deadline: {goal.deadline}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">Set New Goal</Button>
            </div>
          </Card>
        </div>

        {/* Badges Display */}
        <div className="mb-6">
          <BadgesDisplay />
        </div>

        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Reflections</h2>
          <div className="space-y-4">
            <div className="text-center py-8 text-och-steel">
              <p>No reflections yet. Start reflecting on your learning journey.</p>
            </div>
            <Button variant="defender">Add Reflection</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

