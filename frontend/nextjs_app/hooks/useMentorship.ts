/**
 * Mentorship Management Hook
 * Orchestrates mentor matching, sessions, goals, and feedback loops.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGateway } from '@/services/apiGateway';

export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type GoalStatus = 'draft' | 'in_progress' | 'verified';

export interface Mentor {
  id: string;
  name: string;
  avatar?: string;
  expertise: string[];
  track: string;
  bio: string;
  timezone: string;
  readiness_impact: number;
}

export interface MentorshipSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  topic: string;
  notes?: string;
  meeting_link?: string;
}

export interface SmartGoal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  deadline: string;
  category: 'technical' | 'behavioral' | 'career';
  alignment: 'future-you' | 'cohort' | 'mission';
}

export interface MentorshipFeedback {
  id: string;
  session_id: string;
  rating: number; // 1-5
  comment: string;
  mentor_engagement: number;
}

export function useMentorship(userId?: string) {
  const queryClient = useQueryClient();

  // 1. Mentor Matching & Assignment
  const mentorQuery = useQuery({
    queryKey: ['mentorship', 'mentor', userId],
    queryFn: async () => {
      // Mocked for now, will call backend MMM
      return {
        id: 'mentor-1',
        name: 'Alex Rivera',
        avatar: '/avatars/mentor-1.jpg',
        expertise: ['Threat Hunting', 'Cloud Security', 'Leadership'],
        track: 'Defender',
        bio: 'Senior Security Architect with 12+ years experience. Expert in incident response and SOC automation.',
        timezone: 'Africa/Nairobi',
        readiness_impact: 84
      } as Mentor;
    },
    enabled: !!userId,
  });

  // 2. Scheduling & Session Management
  const sessionsQuery = useQuery({
    queryKey: ['mentorship', 'sessions', userId],
    queryFn: async () => {
      // Mocked session data
      return [
        {
          id: 'sess-1',
          mentor_id: 'mentor-1',
          mentee_id: userId || 'me',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
          status: 'confirmed',
          topic: 'Module 3 Review: Network Defense Strategies',
          meeting_link: 'https://meet.google.com/abc-defg-hij'
        },
        {
          id: 'sess-2',
          mentor_id: 'mentor-1',
          mentee_id: userId || 'me',
          start_time: new Date(Date.now() - 172800000).toISOString(),
          end_time: new Date(Date.now() - 172800000 + 3600000).toISOString(),
          status: 'completed',
          topic: 'Future-You Profiling Alignment',
          notes: 'Strong aptitude in behavioral analysis. Focused next steps on SIEM fundamentals.'
        }
      ] as MentorshipSession[];
    },
    enabled: !!userId,
  });

  // 3. Goals & Milestones
  const goalsQuery = useQuery({
    queryKey: ['mentorship', 'goals', userId],
    queryFn: async () => {
      return [
        {
          id: 'goal-1',
          title: 'Master MITRE ATT&CK Mapping',
          description: 'Apply mapping to 5 different malware samples in the lab.',
          status: 'in_progress',
          deadline: new Date(Date.now() + 604800000).toISOString(),
          category: 'technical',
          alignment: 'mission'
        },
        {
          id: 'goal-2',
          title: 'Communication Protocol for SOC',
          description: 'Draft incident reporting templates for tier-1 alerts.',
          status: 'verified',
          deadline: new Date(Date.now() - 86400000).toISOString(),
          category: 'behavioral',
          alignment: 'future-you'
        }
      ] as SmartGoal[];
    },
    enabled: !!userId,
  });

  // Mutations
  const scheduleSession = useMutation({
    mutationFn: async (input: { date: string; topic: string; duration: number }) => {
      // API call to MMM /api/v1/mentorship/sessions/request/
      return { success: true, ...input };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'sessions', userId] });
    },
  });

  const updateGoalStatus = useMutation({
    mutationFn: async ({ goalId, status }: { goalId: string; status: GoalStatus }) => {
      return { success: true, goalId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'goals', userId] });
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async (feedback: Omit<MentorshipFeedback, 'id'>) => {
      return { success: true, id: 'fb-123' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'sessions', userId] });
    },
  });

  return {
    mentor: mentorQuery.data,
    sessions: sessionsQuery.data || [],
    goals: goalsQuery.data || [],
    isLoading: mentorQuery.isLoading || sessionsQuery.isLoading || goalsQuery.isLoading,
    scheduleSession,
    updateGoalStatus,
    submitFeedback,
    refetchAll: () => {
      mentorQuery.refetch();
      sessionsQuery.refetch();
      goalsQuery.refetch();
    }
  };
}


