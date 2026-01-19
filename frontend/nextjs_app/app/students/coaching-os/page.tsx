/**
 * Student Coaching OS Dashboard
 * Main hub for student cybersecurity training and resources
 */
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  Target,
  Users,
  Award,
  ChevronRight,
  Shield,
  Code,
  Search,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function StudentCoachingOSPage() {
  const router = useRouter();

  const modules = [
    {
      title: 'Recipe Library',
      description: 'Interactive cybersecurity hands-on labs and step-by-step guides',
      icon: BookOpen,
      href: '/students/coaching-os/recipes',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-500/10 to-teal-600/10'
    },
    {
      title: 'Missions',
      description: 'Structured cybersecurity challenges and real-world scenarios',
      icon: Target,
      href: '/dashboard/student/missions',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-500/10 to-indigo-600/10'
    },
    {
      title: 'Curriculum',
      description: 'Comprehensive learning paths and skill development tracks',
      icon: Shield,
      href: '/dashboard/student/curriculum',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-500/10 to-pink-600/10'
    },
    {
      title: 'Coaching Sessions',
      description: '1-on-1 mentoring and personalized guidance',
      icon: Users,
      href: '/dashboard/student/coaching',
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-500/10 to-red-600/10'
    }
  ];

  const stats = [
    { label: 'Recipes Completed', value: '12', icon: Award },
    { label: 'Skills Mastered', value: '8', icon: Code },
    { label: 'Missions Solved', value: '15', icon: Target },
    { label: 'Progress Score', value: '87%', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-indigo-900/50">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-400 via-white to-purple-400 bg-clip-text text-transparent">
                Coaching OS
              </h1>
              <p className="text-xl text-slate-300 mt-2">
                Your Cybersecurity Training Hub
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-6 py-12 max-w-6xl">

        {/* WELCOME SECTION */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Your Training Dashboard</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Access interactive cybersecurity labs, complete missions, follow structured curricula,
            and get personalized coaching to advance your cybersecurity career.
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* MODULES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((module, index) => (
            <Card key={index} className={`group relative overflow-hidden bg-gradient-to-br ${module.bgColor} border-slate-700/50 hover:border-slate-600/70 transition-all duration-300`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 bg-gradient-to-r ${module.color} rounded-xl flex items-center justify-center mb-4`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl text-white">{module.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={module.href}>
                  <Button
                    className={`w-full bg-gradient-to-r ${module.color} hover:opacity-90 transition-opacity`}
                  >
                    Access {module.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
              <CardContent className="p-6">
                <Search className="w-8 h-8 text-indigo-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Find Recipes</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Search for specific cybersecurity techniques and labs
                </p>
                <Link href="/students/coaching-os/recipes">
                  <Button variant="outline" size="sm" className="w-full">
                    Browse Recipes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
              <CardContent className="p-6">
                <Target className="w-8 h-8 text-emerald-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Active Missions</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Continue working on your current cybersecurity challenges
                </p>
                <Link href="/dashboard/student/missions">
                  <Button variant="outline" size="sm" className="w-full">
                    View Missions
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-purple-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Schedule Coaching</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Book a session with your cybersecurity mentor
                </p>
                <Link href="/dashboard/student/coaching">
                  <Button variant="outline" size="sm" className="w-full">
                    Book Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
