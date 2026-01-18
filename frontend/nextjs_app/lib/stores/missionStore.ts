import { create } from 'zustand'
import type { Mission, Subtask } from '@/app/dashboard/student/missions/types'

interface MissionStore {
  // Current mission state
  currentMission: Mission | null
  setCurrentMission: (mission: Mission | null) => void

  // Current subtask state
  currentSubtask: Subtask | null
  setCurrentSubtask: (subtask: Subtask | null) => void

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
  setMissionProgress: (missionId: string, progress: number) => void

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
  setCurrentMission: (mission) => set({ currentMission: mission }),

  // Current subtask state
  currentSubtask: null,
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
  setMissionProgress: (missionId, progress) => set((state) => ({
    missionProgress: { ...state.missionProgress, [missionId]: progress }
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
    currentSubtask: null,
    subtasks: []
  }),
  resetStore: () => set({
    currentMission: null,
    currentSubtask: null,
    subtasks: [],
    availableMissions: [],
    inProgressMissions: [],
    completedMissions: [],
    missionProgress: {},
    isLoading: false,
    error: null,
    userTier: 'free',
    tierLock: false
  })
}))