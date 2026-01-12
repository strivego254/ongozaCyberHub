'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import {
  Loader2,
  Target,
  Shield,
  Zap,
  Award,
  Search,
  Filter,
  Clock,
  BookOpen,
  Briefcase,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Rocket,
  CheckCircle2,
  FileCode,
  Map
} from 'lucide-react'
import { MissionsTableView } from './components/MissionsTableView'

interface Mission {
  id: string
  code: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  type?: string
  estimated_time_minutes?: number
  competency_tags?: string[]
  track_key?: string
  status?: string
  progress_percent?: number
  ai_score?: number
  submission_id?: string
  artifacts_uploaded?: number
  artifacts_required?: number
  ai_feedback?: {
    score: number
    strengths: string[]
    gaps: string[]
  }
}

interface MissionsResponse {
  results: Mission[]
  count: number
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export default function MissionsClient() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [directorMissions, setDirectorMissions] = useState<MissionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDirectorMissions, setLoadingDirectorMissions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentTrack, setStudentTrack] = useState<string | undefined>()
  const [studentDifficulty, setStudentDifficulty] = useState<string>('beginner')
  const [filters, setFilters] = useState({
    status: 'all',
    difficulty: 'all',
    track: 'all',
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    has_next: false,
    has_previous: false,
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (authLoading || !isAuthenticated) return

    loadStudentInfo()
    loadMissions()
    loadDirectorMissions()
  }, [isAuthenticated, authLoading, pagination.page, filters.status, filters.difficulty, filters.track, filters.search])

  const loadStudentInfo = async () => {
    try {
      // Get student's enrollment to determine track
      const profileResponse = await apiGateway.get('/student/profile')
      if (profileResponse?.enrollment?.track_key) {
        setStudentTrack(profileResponse.enrollment.track_key)
      }
      
      // Get student's current difficulty level
      const progressResponse = await apiGateway.get('/student/curriculum/progress')
      if (progressResponse?.current_difficulty) {
        setStudentDifficulty(progressResponse.current_difficulty)
      }
    } catch (err) {
      console.error('Failed to load student info:', err)
      // Default to beginner if we can't fetch
      setStudentDifficulty('beginner')
    }
  }

  const loadMissions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: any = {
        page: pagination.page,
        page_size: pagination.page_size,
      }

      if (filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty
      }
      if (filters.track !== 'all') {
        params.track = filters.track
      }
      if (filters.search) {
        params.search = filters.search
      }

      const response = await apiGateway.get<MissionsResponse>('/student/missions', { params })

      setMissions(response.results || [])
      setPagination({
        page: response.page || 1,
        page_size: response.page_size || 20,
        total: response.total || response.count || 0,
        has_next: response.has_next || false,
        has_previous: response.has_previous || false,
      })
    } catch (err: any) {
      console.error('Failed to load missions:', err)
      setError(err?.message || 'Failed to load missions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadDirectorMissions = async () => {
    setLoadingDirectorMissions(true)
    try {
      // Fetch director-defined missions that are published/approved
      const params: any = {
        status: 'published', // Only show published missions to students
        page_size: 1000, // Get all published missions
      }

      // Apply filters if they match director mission fields
      if (filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty
      }
      if (filters.track !== 'all') {
        params.track_key = filters.track
      }
      if (filters.search) {
        params.search = filters.search
      }

      const response = await missionsClient.getAllMissions(params)
      
      // Convert MissionTemplate to Mission format for consistency
      const convertedMissions: Mission[] = (response.results || []).map((template: MissionTemplate) => ({
        id: template.id || '',
        code: template.code,
        title: template.title,
        description: template.description || '',
        difficulty: template.difficulty,
        type: template.type,
        track_key: template.track_key || template.track_id || '',
        estimated_time_minutes: template.estimated_time_minutes || (template.est_hours ? (template.est_hours * 60) : undefined),
        competency_tags: template.competencies || [],
        status: 'not_started', // Director missions are always "not_started" for students until they begin
        progress_percent: 0,
      }))

      setDirectorMissions(convertedMissions)
    } catch (err: any) {
      console.error('Failed to load director missions:', err)
      // Don't set error state - just log it, as student missions might still work
      setDirectorMissions([])
    } finally {
      setLoadingDirectorMissions(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'not_started') {
      return <Badge variant="steel">Not Started</Badge>
    }

    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge variant="mint">Approved</Badge>
      case 'in_ai_review':
        return <Badge variant="defender">AI Review</Badge>
      case 'in_mentor_review':
        return <Badge variant="orange">Mentor Review</Badge>
      case 'submitted':
        return <Badge variant="steel">Submitted</Badge>
      case 'in_progress':
      case 'draft':
        return <Badge variant="defender">In Progress</Badge>
      case 'changes_requested':
      case 'failed':
        return <Badge variant="orange">Changes Requested</Badge>
      default:
        return <Badge variant="steel">{status}</Badge>
    }
  }

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return { 
          color: 'och-mint', 
          colorClass: 'text-och-mint', 
          bgClass: 'bg-och-mint/20', 
          borderClass: 'border-och-mint/40',
          icon: Shield, 
          label: 'Beginner' 
        }
      case 'intermediate':
        return { 
          color: 'och-defender', 
          colorClass: 'text-och-defender', 
          bgClass: 'bg-och-defender/20', 
          borderClass: 'border-och-defender/40',
          icon: Target, 
          label: 'Intermediate' 
        }
      case 'advanced':
        return { 
          color: 'och-orange', 
          colorClass: 'text-och-orange', 
          bgClass: 'bg-och-orange/20', 
          borderClass: 'border-och-orange/40',
          icon: Zap, 
          label: 'Advanced' 
        }
      case 'capstone':
        return { 
          color: 'och-gold', 
          colorClass: 'text-och-gold', 
          bgClass: 'bg-och-gold/20', 
          borderClass: 'border-och-gold/40',
          icon: Award, 
          label: 'Capstone' 
        }
      default:
        return { 
          color: 'och-steel', 
          colorClass: 'text-och-steel', 
          bgClass: 'bg-och-steel/20', 
          borderClass: 'border-och-steel/40',
          icon: Shield, 
          label: difficulty 
        }
    }
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Merge student missions and director missions
  const allMissions = useMemo(() => {
    // Combine both mission sources
    const combined = [...missions, ...directorMissions]
    
    // Remove duplicates based on mission ID or code
    const uniqueMissions = combined.filter((mission, index, self) =>
      index === self.findIndex((m) => m.id === mission.id || (m.code && m.code === mission.code))
    )
    
    // Apply status filter if needed (director missions are always 'not_started')
    if (filters.status !== 'all') {
      return uniqueMissions.filter(m => {
        if (filters.status === 'not_started') {
          return m.status === 'not_started' || !m.status
        }
        return m.status === filters.status
      })
    }
    
    return uniqueMissions
  }, [missions, directorMissions, filters.status])

  const handleMissionClick = (missionId: string) => {
    router.push(`/dashboard/student/missions/${missionId}`)
  }

  if (loading && missions.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center p-4">
        <Card className="p-12 bg-och-midnight/90 border border-och-gold/30 rounded-3xl max-w-md w-full">
          <div className="text-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto"
            >
              <Target className="w-16 h-16 text-och-gold" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Loading Missions
              </h2>
              <p className="text-sm text-och-steel font-medium">
                Fetching available missions from the backend
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center p-4">
        <Card className="p-12 bg-och-midnight/90 border border-och-defender/40 rounded-3xl max-w-2xl w-full">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-och-defender/10 flex items-center justify-center mx-auto border-2 border-och-defender/30">
              <AlertTriangle className="w-12 h-12 text-och-defender" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Failed to Load Missions</h1>
              <p className="text-base text-och-steel leading-relaxed">{error}</p>
            </div>
            <Button
              onClick={loadMissions}
              variant="defender"
              className="font-black uppercase tracking-widest text-sm"
              glow
            >
              <Rocket className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950">
      {/* Hero Section - Full Width */}
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-och-gold/10 via-och-mint/10 to-och-defender/10" />
        <div className="relative w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20 xl:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 lg:mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-och-defender to-och-orange mb-6 sm:mb-8 shadow-2xl shadow-och-defender/30"
            >
              <Target className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-3 sm:mb-4 lg:mb-6 uppercase tracking-tighter leading-tight">
              Mission <span className="text-och-gold">Control</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-och-steel max-w-4xl mx-auto font-medium leading-relaxed px-4">
              The operational heart of OCH. Structured, scenario-based practical challenges that transform learners from conceptual understanding to industry-ready competence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters Section - Full Width */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="w-full bg-och-midnight/60 border border-och-steel/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Status Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-och-steel uppercase tracking-widest mb-2 sm:mb-3">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                >
                  <option value="all">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_ai_review">In AI Review</option>
                  <option value="in_mentor_review">In Mentor Review</option>
                  <option value="approved">Approved</option>
                  <option value="changes_requested">Changes Requested</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-och-steel uppercase tracking-widest mb-2 sm:mb-3">
                  Difficulty
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => {
                    setFilters({ ...filters, difficulty: e.target.value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="capstone">Capstone</option>
                </select>
              </div>

              {/* Track Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-och-steel uppercase tracking-widest mb-2 sm:mb-3">
                  Track
                </label>
                <select
                  value={filters.track}
                  onChange={(e) => {
                    setFilters({ ...filters, track: e.target.value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                >
                  <option value="all">All Tracks</option>
                  <option value="defender">Defender</option>
                  <option value="offensive">Offensive</option>
                  <option value="grc">GRC</option>
                  <option value="innovation">Innovation</option>
                  <option value="leadership">Leadership</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-och-steel uppercase tracking-widest mb-2 sm:mb-3">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-och-steel" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value })
                      setPagination({ ...pagination, page: 1 })
                    }}
                    placeholder="Search missions..."
                    className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Missions Table View */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 lg:py-16">
        <MissionsTableView
          missions={allMissions}
          loading={loading || loadingDirectorMissions}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          studentTrack={studentTrack}
          studentDifficulty={studentDifficulty}
        />
      </section>
    </div>
  )
}
