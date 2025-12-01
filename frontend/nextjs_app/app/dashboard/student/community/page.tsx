'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function CommunityPage() {
  const posts = [
    {
      id: '1',
      title: 'Best Practices for Network Security',
      author: 'Jane Doe',
      group: 'Cybersecurity Students',
      replies: 12,
      views: 145,
      timestamp: '2 hours ago',
      tags: ['Security', 'Networking'],
    },
    {
      id: '2',
      title: 'Study Group for Security+ Exam',
      author: 'John Smith',
      group: 'Certification Prep',
      replies: 8,
      views: 89,
      timestamp: '5 hours ago',
      tags: ['Certification', 'Study Group'],
    },
    {
      id: '3',
      title: 'Weekly Challenge: Encryption Challenge',
      author: 'Admin',
      group: 'Challenges',
      replies: 25,
      views: 312,
      timestamp: '1 day ago',
      tags: ['Challenge', 'Encryption'],
    },
  ]

  const groups = [
    { id: '1', name: 'Cybersecurity Students', members: 245, posts: 89 },
    { id: '2', name: 'Certification Prep', members: 156, posts: 45 },
    { id: '3', name: 'Challenges', members: 312, posts: 120 },
  ]

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Community</h1>
          <p className="text-och-steel">
            Posts, groups, announcements, and social engagement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Recent Posts</h2>
              <Button variant="mint">New Post</Button>
            </div>

            {posts.map((post) => (
              <Card key={post.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="defender">{post.group}</Badge>
                      <span className="text-xs text-och-steel">{post.timestamp}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-och-steel mb-2">
                      <span>By {post.author}</span>
                      <span>{post.replies} replies</span>
                      <span>{post.views} views</span>
                    </div>
                    <div className="flex gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="steel" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3">View Discussion</Button>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="text-xl font-bold mb-4 text-white">Your Groups</h2>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.id} className="p-3 bg-och-midnight/50 rounded-lg">
                    <div className="font-medium text-white mb-1">{group.name}</div>
                    <div className="text-xs text-och-steel">
                      {group.members} members • {group.posts} posts
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">Browse All Groups</Button>
            </Card>

            <Card>
              <h2 className="text-xl font-bold mb-4 text-white">Announcements</h2>
              <div className="space-y-3">
                <div className="p-3 bg-och-gold/20 rounded-lg">
                  <div className="font-medium text-white mb-1">New Course Available</div>
                  <div className="text-xs text-och-steel">
                    Advanced Penetration Testing course is now live!
                  </div>
                </div>
                <div className="p-3 bg-och-defender/20 rounded-lg">
                  <div className="font-medium text-white mb-1">Upcoming Workshop</div>
                  <div className="text-xs text-och-steel">
                    Join us for a live Q&A session next Friday
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

