'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function PortfolioPage() {
  const portfolioItems = [
    {
      id: '1',
      title: 'Network Security Assessment',
      description: 'Comprehensive security assessment of a corporate network',
      type: 'project',
      status: 'published',
      date: '2024-11-15',
      tags: ['Security', 'Networking', 'Assessment'],
    },
    {
      id: '2',
      title: 'Encryption Implementation',
      description: 'Implemented AES-256 encryption for data protection',
      type: 'project',
      status: 'draft',
      date: '2024-11-20',
      tags: ['Encryption', 'Security', 'Implementation'],
    },
    {
      id: '3',
      title: 'Penetration Testing Report',
      description: 'Ethical hacking assessment report',
      type: 'document',
      status: 'published',
      date: '2024-10-30',
      tags: ['Penetration Testing', 'Report', 'Security'],
    },
  ]

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
              <div className="text-3xl font-bold text-och-mint mb-1">{portfolioItems.length}</div>
              <div className="text-sm text-och-steel">Total Items</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-gold mb-1">
                {portfolioItems.filter(i => i.status === 'published').length}
              </div>
              <div className="text-sm text-och-steel">Published</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-defender mb-1">
                {portfolioItems.filter(i => i.status === 'draft').length}
              </div>
              <div className="text-sm text-och-steel">Drafts</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioItems.map((item) => (
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
                  {item.tags.map((tag) => (
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
          ))}
        </div>
      </div>
    </div>
  )
}

