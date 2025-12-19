# Finance Role Implementation

## Overview

The Finance role is a specialized administrative user responsible for centralized billing, revenue operations, and financial oversight of the OCH platform. Access is strictly governed to protect sensitive data; notably, Finance users have **no access to student PII** beyond what is strictly required for billing.

## Analogy

Think of the Finance Dashboard as the **Control Tower of a Toll Road System**:
- While Program Directors manage the "traffic" (students)
- And Mentors act as "navigators"
- The Finance Dashboard is where:
  - Tolls (subscriptions) are set
  - Revenue is counted
  - "EZ-Pass" (sponsorship codes) are issued
  - To ensure the entire infrastructure remains funded and operational

## Test User

**Credentials:**
- Email: `finance@test.com`
- Password: `testpass123`
- Role: `finance`
- MFA: Required (enabled by default for Finance users)

## Dashboard Features

### 1. Product and Price Management (Catalog)
**Route:** `/dashboard/finance/catalog`

- **Catalog Management:** Create and edit products (one-time seats, subscriptions, installment bundles, and add-ons)
- **Price Books:** Manage versioned price books by currency (BWP, USD, ZAR, KES) and define channel-specific pricing (public, private, or corporate)
- **Tax Configuration:** Define and manage regional tax rules and jurisdictional rates (e.g., Botswana DPA or regional VAT)
- **Seat Cap Oversight:** Set and monitor seat caps for various cohorts and tracks

### 2. Financial Analytics and Reporting
**Route:** `/dashboard/finance/analytics`

- **Core Revenue Metrics:** Track MRR (Monthly Recurring Revenue), ARR (Annual Recurring Revenue), and Gross/Net revenue by product or currency
- **Operational KPIs:** Monitor DSO (Days Sales Outstanding), dunning recovery percentages, and cohort fill rates
- **Payment Health:** View the payment method mix and track authorization vs. capture success rates
- **Financial Packs:** Build and export specialized "finance packs" or datasets for reconciliation and accounting

### 3. Billing and Transactional Operations
**Route:** `/dashboard/finance/billing`

- **Invoicing:** Issue tax-compliant PDFs, amend existing invoices (where permitted), and post credits
- **Refund Management:** Initiate and approve refunds, voids, or write-offs
- **Dunning Queue:** Monitor the dunning queue for failed payments, including tracking retry statuses and grace periods
- **Reconciliation:** Access a dedicated reconciliation dashboard to match internal ledgers against gateway payout files (e.g., Paystack, Flutterwave)

### 4. Sponsorship and Wallet Management
**Route:** `/dashboard/finance/sponsorship`

- **Sponsorship Wallets:** Access and manage sponsorship wallets and budget tracking for foundations or corporate partners
- **Sponsorship Codes:** Issue scholarship and sponsorship codes and view real-time utilization reports for corporate seats

### 5. Engagement and Reward Oversight
**Route:** `/dashboard/finance/rewards`

- **Rewards Budgeting:** Define and manage budgets for credits, vouchers, and rewards
- **Reward Ledgers:** View ledgers of redeemed points and approve high-value reward payouts
- **Voucher Management:** Issue or revoke vouchers based on policy compliance

### 6. Security and System Monitoring
**Route:** `/dashboard/finance/security`

- **Mandatory MFA:** Multi-Factor Authentication (MFA) is strictly required for the Finance role due to the sensitivity of financial data
- **Payment Logs:** Track payment-related message logs and failed payment notification logs
- **Service Health:** Access read-only service health dashboards (without access to raw system logs)

## Implementation Details

### Backend
- ✅ Finance role exists in `users/models.py` (Role model)
- ✅ Finance role included in test user creation script
- ✅ Finance test user created with MFA enabled

### Frontend
- ✅ Finance role added to RBAC utilities (`utils/rbac.ts`)
- ✅ Finance routes added to route permissions
- ✅ Finance redirect route configured (`/dashboard/finance`)
- ✅ Finance navigation component created
- ✅ Finance dashboard main page created
- ✅ All 6 feature pages created:
  - Catalog (Product & Price Management)
  - Analytics (Financial Analytics & Reporting)
  - Billing (Billing & Transactional Operations)
  - Sponsorship (Sponsorship & Wallet Management)
  - Rewards (Engagement & Reward Oversight)
  - Security (Security & System Monitoring)

### Files Created

**Frontend:**
- `app/dashboard/finance/page.tsx` - Main dashboard page
- `app/dashboard/finance/layout.tsx` - Layout wrapper
- `app/dashboard/finance/finance-client.tsx` - Main dashboard client component
- `app/dashboard/finance/catalog/page.tsx` - Product & Price Management
- `app/dashboard/finance/analytics/page.tsx` - Financial Analytics
- `app/dashboard/finance/billing/page.tsx` - Billing & Transactions
- `app/dashboard/finance/sponsorship/page.tsx` - Sponsorship & Wallets
- `app/dashboard/finance/rewards/page.tsx` - Engagement & Rewards
- `app/dashboard/finance/security/page.tsx` - Security & Monitoring
- `components/navigation/FinanceNavigation.tsx` - Finance navigation sidebar

**Backend:**
- Updated `users/management/commands/create_test_users.py` - Added Finance test user

**Utilities:**
- Updated `utils/rbac.ts` - Added Finance role to RBAC system
- Updated `utils/redirect.ts` - Added Finance redirect mapping

## Security Considerations

1. **MFA Required:** All Finance users must have MFA enabled
2. **No Student PII:** Finance users have no access to student PII beyond billing requirements
3. **Audit Logging:** All financial operations should be logged for audit purposes
4. **Role-based Access:** Finance role is separate from Admin role with limited scope

## Next Steps (Future Implementation)

1. **Backend API Endpoints:**
   - Create Finance API views and serializers
   - Implement product/price management endpoints
   - Create financial analytics aggregation endpoints
   - Build billing/invoicing endpoints
   - Add sponsorship/wallet management endpoints

2. **Database Models:**
   - Products model (if not exists)
   - Price Books model
   - Tax Rules model
   - Sponsorship Wallets model
   - Vouchers/Rewards models

3. **Integration:**
   - Payment gateway integrations (Paystack, Flutterwave)
   - Invoice PDF generation
   - Financial reporting exports
   - Reconciliation automation

4. **Features:**
   - Real-time revenue metrics
   - Automated dunning processes
   - Voucher code generation
   - Financial pack exports

## Testing

To test the Finance dashboard:

1. Create Finance user (already done):
   ```bash
   python manage.py create_test_users
   ```

2. Login with Finance credentials:
   - Email: `finance@test.com`
   - Password: `testpass123`

3. Access dashboard:
   - Navigate to `/dashboard/finance`
   - Explore all 6 feature sections

## Notes

- All Finance pages are currently UI skeletons with placeholder data
- Backend API endpoints need to be implemented to populate real data
- Financial calculations and aggregations need backend implementation
- Integration with payment gateways is required for full functionality

