import { create } from 'zustand'
import type { Mission, Subtask, MissionProgress } from '@/app/dashboard/student/missions/types'

interface MissionStore {
  // Current mission state
  currentMission: Mission | null
  currentProgress: MissionProgress | null
  setCurrentMission: (mission: Mission | null) => void
  setCurrentProgress: (progress: MissionProgress | null) => void

  // Current subtask state
  currentSubtask: number
  setCurrentSubtask: (subtask: number) => void

  // Subtasks management
  subtasks: Subtask[]
  setSubtasks: (subtasks: Subtask[]) => void
  addSubtask: (subtask: Subtask) => void
  updateSubtask: (id: string, updates: Partial<Subtask>) => void
  removeSubtask: (id: string) => void

  // Mission list management
  availableMissions: Mission[]
  setAvailableMissions: (missions: Mission[]) => void
  addAvailableMission: (mission: Mission) => void

  inProgressMissions: Mission[]
  setInProgressMissions: (missions: Mission[]) => void
  addInProgressMission: (mission: Mission) => void
  removeInProgressMission: (id: string) => void

  completedMissions: Mission[]
  setCompletedMissions: (missions: Mission[]) => void
  addCompletedMission: (mission: Mission) => void
  removeCompletedMission: (id: string) => void

  // Mission progress
  missionProgress: Record<string, number>
  subtasksProgress: Record<number, { completed: boolean; evidence: string[]; notes: string }>
  setMissionProgress: (missionId: string, progress: number) => void
  updateSubtaskProgress: (subtaskNumber: number, progress: { completed: boolean; evidence: string[]; notes: string }) => void

  // Feedback management
  aiFeedback: any | null
  mentorFeedback: any | null
  setAIFeedback: (feedback: any | null) => void
  setMentorFeedback: (feedback: any | null) => void

  // UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void

  // User tier management
  userTier: string
  setUserTier: (tier: string) => void
  tierLock: boolean
  setTierLock: (locked: boolean) => void

  // Actions
  clearCurrentMission: () => void
  resetStore: () => void
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  // Current mission state
  currentMission: null,
  currentProgress: null,
  setCurrentMission: (mission) => set({ currentMission: mission }),
  setCurrentProgress: (progress) => set({ currentProgress: progress }),

  // Current subtask state
  currentSubtask: 1,
  setCurrentSubtask: (subtask) => set({ currentSubtask: subtask }),

  // Subtasks management
  subtasks: [],
  setSubtasks: (subtasks) => set({ subtasks }),
  addSubtask: (subtask) => set((state) => ({
    subtasks: [...state.subtasks, subtask]
  })),
  updateSubtask: (id, updates) => set((state) => ({
    subtasks: state.subtasks.map(st => st.id === id ? { ...st, ...updates } : st)
  })),
  removeSubtask: (id) => set((state) => ({
    subtasks: state.subtasks.filter(st => st.id !== id)
  })),

  // Mission list management
  availableMissions: [],
  setAvailableMissions: (missions) => set({ availableMissions: missions }),
  addAvailableMission: (mission) => set((state) => ({
    availableMissions: [...state.availableMissions, mission]
  })),

  inProgressMissions: [],
  setInProgressMissions: (missions) => set({ inProgressMissions: missions }),
  addInProgressMission: (mission) => set((state) => ({
    inProgressMissions: [...state.inProgressMissions, mission]
  })),
  removeInProgressMission: (id) => set((state) => ({
    inProgressMissions: state.inProgressMissions.filter(m => m.id !== id)
  })),

  completedMissions: [],
  setCompletedMissions: (missions) => set({ completedMissions: missions }),
  addCompletedMission: (mission) => set((state) => ({
    completedMissions: [...state.completedMissions, mission]
  })),
  removeCompletedMission: (id) => set((state) => ({
    completedMissions: state.completedMissions.filter(m => m.id !== id)
  })),

  // Mission progress
  missionProgress: {},
  subtasksProgress: {},
  setMissionProgress: (missionId, progress) => set((state) => ({
    missionProgress: { ...state.missionProgress, [missionId]: progress }
  })),
  updateSubtaskProgress: (subtaskNumber, progress) =>
    set((state) => ({
      subtasksProgress: {
        ...state.subtasksProgress,
        [subtaskNumber]: progress,
      },
    })),

  // UI state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

  // User tier management
  userTier: 'free',
  setUserTier: (tier) => set({ userTier: tier }),
  tierLock: false,
  setTierLock: (locked) => set({ tierLock: locked }),

  // Actions
  clearCurrentMission: () => set({
    currentMission: null,
    currentSubtask: 1,
    subtasks: []
  }),
  resetStore: () => set({
    currentMission: null,
    currentProgress: null,
    currentSubtask: 1,
    subtasks: [],
    availableMissions: [],
    inProgressMissions: [],
    completedMissions: [],
    missionProgress: {},
    subtasksProgress: {},
    missionProgress: {},
    isLoading: false,
    error: null,
    userTier: 'free',
    tierLock: false
  })
}))