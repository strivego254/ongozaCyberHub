export interface PortfolioItem {
  id: string
  title: string
  description: string
  skills: string[]
  mission_id?: string
  mission_title?: string
  created_at: string
  updated_at: string
  file_url?: string
  thumbnail_url?: string
}

export interface PortfolioCounts {
  total_items: number
  limit: number
  tier: 'starter' | 'premium' | 'enterprise'
}

