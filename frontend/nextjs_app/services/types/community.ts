export interface CommunityPost {
  id: string
  author_id: string
  author_name: string
  author_avatar?: string
  title: string
  content: string
  group_id?: string
  group_name?: string
  tags: string[]
  created_at: string
  updated_at?: string
  reply_count: number
  view_count: number
  reaction_count: number
  reactions?: PostReaction[]
  pinned: boolean
  highlighted: boolean
}

export interface PostReaction {
  emoji: string
  count: number
  user_reacted: boolean
}

export interface PostComment {
  id: string
  post_id: string
  author_id: string
  author_name: string
  author_avatar?: string
  content: string
  created_at: string
  reactions?: PostReaction[]
  reply_to_id?: string
}

export interface CommunityGroup {
  id: string
  name: string
  description: string
  member_count: number
  post_count: number
  is_private: boolean
  track_id?: string
  joined: boolean
  role?: 'member' | 'moderator' | 'admin'
}

