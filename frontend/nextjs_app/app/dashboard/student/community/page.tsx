'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function CommunityPage() {
  const posts: any[] = []
  const groups: any[] = []

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

            {posts.length === 0 ? (
              <Card>
                <div className="text-center py-8 text-och-steel">
                  <p>No posts yet. Be the first to post!</p>
                </div>
              </Card>
            ) : (
              posts.map((post) => (
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
              ))
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="text-xl font-bold mb-4 text-white">Your Groups</h2>
              <div className="space-y-3">
                {groups.length === 0 ? (
                  <div className="text-center py-4 text-och-steel">
                    <p>No groups yet.</p>
                  </div>
                ) : (
                  groups.map((group) => (
                  <div key={group.id} className="p-3 bg-och-midnight/50 rounded-lg">
                    <div className="font-medium text-white mb-1">{group.name}</div>
                    <div className="text-xs text-och-steel">
                      {group.members} members • {group.posts} posts
                    </div>
                  </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">Browse All Groups</Button>
            </Card>

            <Card>
              <h2 className="text-xl font-bold mb-4 text-white">Announcements</h2>
              <div className="space-y-3">
                <div className="text-center py-4 text-och-steel">
                  <p>No announcements at this time.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

