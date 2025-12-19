/**
 * Product and Price Management (Catalog) Page
 * Finance users manage the commercial structure of programs
 */

'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ShoppingCart, 
  DollarSign, 
  Globe, 
  Users,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

export default function CatalogPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-h1 font-bold text-white">Product & Price Management</h1>
              <p className="mt-1 body-m text-och-steel">
                Manage products, price books, tax configuration, and seat caps
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-och-steel/20 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button className="border-och-defender text-och-mint whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Products
                </button>
                <button className="border-transparent text-och-steel hover:text-white hover:border-och-steel/30 whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Price Books
                </button>
                <button className="border-transparent text-och-steel hover:text-white hover:border-och-steel/30 whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Tax Configuration
                </button>
                <button className="border-transparent text-och-steel hover:text-white hover:border-och-steel/30 whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Seat Caps
                </button>
              </nav>
            </div>

            {/* Products Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-h2 font-semibold text-white">Products</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product Types */}
                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-h3 font-semibold text-white">One-Time Seats</h3>
                    <Badge variant="default">0 products</Badge>
                  </div>
                  <p className="body-m text-och-steel mb-4">
                    Single purchase seats for programs
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage
                  </Button>
                </Card>

                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-h3 font-semibold text-white">Subscriptions</h3>
                    <Badge variant="default">0 products</Badge>
                  </div>
                  <p className="body-m text-och-steel mb-4">
                    Recurring subscription plans
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage
                  </Button>
                </Card>

                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-h3 font-semibold text-white">Installment Bundles</h3>
                    <Badge variant="default">0 products</Badge>
                  </div>
                  <p className="body-m text-och-steel mb-4">
                    Multi-payment installment plans
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage
                  </Button>
                </Card>

                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-h3 font-semibold text-white">Add-ons</h3>
                    <Badge variant="default">0 products</Badge>
                  </div>
                  <p className="body-m text-och-steel mb-4">
                    Additional products and services
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage
                  </Button>
                </Card>
              </div>

              {/* Price Books Section */}
              <Card className="p-6 mt-8 bg-och-midnight border border-och-steel/20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-h2 font-semibold text-white">Price Books</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Price Book
                  </Button>
                </div>
                <p className="body-m text-och-steel mb-4">
                  Manage versioned price books by currency (BWP, USD, ZAR, KES) and channel-specific pricing
                </p>
                <div className="text-center py-8 text-och-steel">
                  <Globe className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                  <p className="body-m">No price books configured</p>
                </div>
              </Card>

              {/* Tax Configuration */}
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-h2 font-semibold text-white">Tax Configuration</h2>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tax Rule
                  </Button>
                </div>
                <p className="body-m text-och-steel mb-4">
                  Define and manage regional tax rules and jurisdictional rates (e.g., Botswana DPA or regional VAT)
                </p>
                <div className="text-center py-8 text-och-steel">
                  <p className="body-m">No tax rules configured</p>
                </div>
              </Card>

              {/* Seat Cap Oversight */}
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-h2 font-semibold text-white">Seat Cap Oversight</h2>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Caps
                  </Button>
                </div>
                <p className="body-m text-och-steel mb-4">
                  Set and monitor seat caps for various cohorts and tracks
                </p>
                <div className="text-center py-8 text-och-steel">
                  <p className="body-m">No seat caps configured</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

