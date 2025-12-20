'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, 
  Shield, 
  MapPin,
  CheckCircle,
  Globe
} from 'lucide-react'

export default function Home() {
  const router = useRouter()

  const handleStartTrial = () => {
    router.push('/signup/student')
  }

  const transformationPhases = [
    {
      phase: 0,
      name: 'Entry',
      goal: 'Awareness & Belonging',
      circle: 'Community Circle',
      activities: ['Join OCH Community', 'Events', 'University Clubs'],
      colorClass: 'bg-och-defender/20'
    },
    {
      phase: 1,
      name: 'Foundation',
      goal: 'Learning & Alignment',
      circle: 'Masterclass Circle',
      activities: ['Intro Courses', 'Orientation', 'Foundational Assessments'],
      colorClass: 'bg-och-mint/20'
    },
    {
      phase: 2,
      name: 'Discovery',
      goal: 'Skills & Confidence',
      circle: 'Specialist Circle',
      activities: ['Labs', 'Missions', 'Beginner Competitions'],
      colorClass: 'bg-och-gold/20'
    },
    {
      phase: 3,
      name: 'Competence',
      goal: 'Deep Practice',
      circle: 'Mastery Circle',
      activities: ['Real Challenges', 'Peer Reviews', 'Mentorship'],
      colorClass: 'bg-och-orange/20'
    },
    {
      phase: 4,
      name: 'Contribution',
      goal: 'Leadership & Influence',
      circle: 'Mastermind Circle',
      activities: ['Lead Teams', 'Coaching', 'University-Level Competitions'],
      colorClass: 'bg-och-savanna-green/20'
    },
    {
      phase: 5,
      name: 'Creation',
      goal: 'Vision & Legacy',
      circle: 'Mastermind Circle',
      activities: ['Capstone Projects', 'Cyber Startups', 'Research & Innovation'],
      colorClass: 'bg-och-night-sky/20'
    }
  ]

  const pricingPlans = [
    { duration: '1 Month', total: '$7', monthly: '$7', discount: 'Base' },
    { duration: '3 Months', total: '$19', monthly: '~$6.33', discount: 'Small discount' },
    { duration: '6 Months', total: '$36', monthly: '$6', discount: 'Medium discount' },
    { duration: '9 Months', total: '$52', monthly: '~$5.78', discount: 'Larger discount' },
    { duration: '12 Months', total: '$68', monthly: '~$5.66', discount: 'Annual plan, renewable' }
  ]

  return (
    <div className="min-h-screen bg-och-midnight text-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-och-midnight/95 backdrop-blur-md border-b border-och-steel/20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-och-mint" />
                <span className="text-xl font-bold text-och-mint">OCH Platform</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-och-steel hover:text-och-mint transition-colors">Home</Link>
              <Link href="/pricing" className="text-och-steel hover:text-och-mint transition-colors">Pricing</Link>
              <Link href="/about" className="text-och-steel hover:text-och-mint transition-colors">About</Link>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleStartTrial}
                className="px-4 py-2 bg-och-defender hover:bg-och-defender/90 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Get Started
              </button>
              <Link
                href="/login/student"
                className="px-4 py-2 border border-och-mint text-och-mint hover:bg-och-mint/10 rounded-lg font-semibold transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </nav>
      </header>


      {/* Hero Section */}
      <section className="relative pt-[234px] pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-och-night-sky/20 via-och-midnight to-och-midnight"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(51,255,193,0.1),transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-och-defender/20 border border-och-defender/40 rounded-full mb-8">
              <MapPin className="h-4 w-4 text-och-defender" />
              <span className="text-sm text-och-mint">Starting in Nairobi • Expanding across Africa</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Become Africa's Next Cyber Leader - Start in Nairobi
            </h1>
            <p className="text-xl text-och-steel/80 max-w-3xl mx-auto mb-10">
              Connect, learn, and grow through personalized mentorship and role-based experiences. 
              Transform from student to cyber leader in 6 progressive phases.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartTrial}
                className="px-8 py-4 bg-och-defender hover:bg-och-defender/90 text-white rounded-2xl font-bold text-lg flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <span>Start Your 14-Day Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Journey */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-och-midnight to-och-night-sky/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Your Transformation Journey</h2>
            <p className="text-xl text-och-steel max-w-3xl mx-auto">
              Progress through 6 phases from awareness to creation, with each phase unlocking new opportunities and circles
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {transformationPhases.map((phase, index) => (
                <div
                  key={phase.phase}
                  className="relative bg-och-midnight border border-och-steel/20 rounded-xl p-6 hover:border-och-mint/50 transition-all duration-200 hover:shadow-lg hover:shadow-och-mint/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-12 h-12 rounded-full ${phase.colorClass} flex items-center justify-center`}>
                        <span className="text-2xl font-bold text-och-mint">{phase.phase}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                        <p className="text-sm text-och-steel">{phase.circle}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-och-mint mb-2">Goal: {phase.goal}</p>
                    <ul className="space-y-1">
                      {phase.activities.map((activity, idx) => (
                        <li key={idx} className="text-sm text-och-steel flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-och-savanna-green" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* Pricing Teaser */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-och-midnight">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Start Your Journey Today</h2>
          <p className="text-xl text-och-steel mb-8">
            Start with a 14-day free trial, continue from <span className="text-och-mint font-bold">$5.66/month</span>
          </p>
            <p className="text-och-steel mb-12">
              All subscriptions include full access to Community, SMP, and Certificates.
            </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-och-midnight border rounded-xl p-6 ${
                  index === 4 
                    ? 'border-och-mint/50 shadow-lg shadow-och-mint/10' 
                    : 'border-och-steel/20'
                }`}
              >
                <div className="text-sm text-och-steel mb-2">{plan.duration}</div>
                <div className="text-2xl font-bold text-white mb-1">{plan.total}</div>
                <div className="text-sm text-och-mint mb-2">{plan.monthly}/month</div>
                {index === 4 && (
                  <div className="text-xs text-och-mint font-semibold mt-2">Best Value</div>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-och-mint hover:bg-och-mint/90 text-och-midnight font-bold text-lg rounded-lg transition-colors"
          >
            <span>View Full Pricing</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Africa Expansion Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-och-defender/20 via-och-night-sky/30 to-och-defender/20 border-t border-b border-och-defender/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <Globe className="h-12 w-12 text-och-defender" />
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Coming Soon – Expanding Across Africa</h3>
                <p className="text-och-steel">
                  After our Nairobi pilot, we're bringing OCH to Botswana, Namibia, Zambia, and Rwanda
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-och-midnight border-t border-och-steel/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-och-mint" />
                <span className="text-lg font-bold text-och-mint">OCH Platform</span>
              </div>
              <p className="text-sm text-och-steel">
                Africa's premier cyber talent platform for university students
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-och-steel">
                <li><Link href="/about" className="hover:text-och-mint transition-colors">About</Link></li>
                <li><Link href="/pricing" className="hover:text-och-mint transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-och-steel">
                <li><Link href="/contact" className="hover:text-och-mint transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-och-mint transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-och-steel/20 pt-8 text-center text-sm text-och-steel">
            <p>&copy; {new Date().getFullYear()} Ongoza Cyber Hub (OCH). All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
