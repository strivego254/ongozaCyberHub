'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function PortfolioPage() {
  const portfolioItems: any[] = []

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Portfolio</h1>
            <p className="text-och-steel">
              Your evidence items, uploads, and portfolio management
            </p>
          </div>
          <Button variant="mint">Add New Item</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-mint mb-1">0</div>
              <div className="text-sm text-och-steel">Total Items</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-gold mb-1">0</div>
              <div className="text-sm text-och-steel">Published</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-defender mb-1">0</div>
              <div className="text-sm text-och-steel">Drafts</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioItems.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <div className="text-center py-8 text-och-steel">
                <p>No portfolio items yet. Add your first item to get started.</p>
              </div>
            </Card>
          ) : (
            portfolioItems.map((item) => (
            <Card key={item.id}>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={item.status === 'published' ? 'mint' : 'steel'}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-och-steel">{item.type}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-och-steel mb-3">{item.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.tags.map((tag: string) => (
                    <Badge key={tag} variant="steel" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-och-steel mb-3">Added: {item.date}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">View</Button>
                <Button variant="defender" className="flex-1">Edit</Button>
              </div>
            </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

