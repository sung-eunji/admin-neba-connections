# Neba Connections Admin - NRF Europe Dashboard

## Overview

This is an internal admin web app for analyzing B2B opportunities at retail events, specifically built for NRF Europe 2025 exhibitor data. The application includes authentication and route protection for secure access.

## Features Implemented

### 🔐 Authentication & Security

- **Login System**: Simple username/password authentication
- **Route Protection**: Middleware guards all `/events/*` and `/api/events/*` routes
- **HTTP-only Cookies**: Secure session management
- **Logout Functionality**: Clear session and redirect to login

### 🎯 Core Functionality

- **Search & Filter**: Full-text search across company name, info, activities, and target markets
- **Country Filtering**: Default to France, with options for all countries or specific selections
- **Pants Candidate Toggle**: Filter for companies relevant to apparel sales
- **Real-time Updates**: Debounced search with instant filter updates

### 📊 Analytics Dashboard

- **KPIs**: Total exhibitors, France-based count, Fashion/Retail count, Marketplace/E-commerce count
- **Charts**:
  - Bar chart showing exhibitors by country (top 10)
  - Bar chart showing exhibitors by category
- **Interactive Table**: Paginated results with detailed company information

### 🏷️ Smart Categorization

Automatic categorization based on company data:

- **Fashion Brand Retail**: apparel, clothing, fashion, brand, retail, boutique, shoes, footwear, textile
- **Marketplace E-commerce**: marketplace, e-commerce, webshop, platform, omnichannel
- **Home Interior**: home, interior, furniture, decoration, homewares
- **Payments POS**: payment, pos, terminal, checkout, acquirer, card processing
- **Logistics Fulfillment**: logistics, fulfillment, warehouse, 3pl, shipping, carrier
- **Retail Tech SaaS**: saas, software, crm, cdp, analytics, ai, vision, inventory, pricing, planogram, plm
- **In-store Hardware Signage**: kiosk, signage, digital signage, display, scanner, rfid, handheld, pda, barcode
- **Other**: Default category

### 🇫🇷 France Detection

Automatic detection of France-based companies using keywords:

- france, paris, lyon, marseille, bordeaux, lille, toulouse, nantes, french, français

### 👖 Pants Candidate Logic

Companies are marked as "pants candidates" if they:

- Are France-based (any French location)
- Have apparel/retail keywords in their data
- Are categorized as fashion_brand_retail, marketplace_ecommerce, or home_interior

## Technical Implementation

### 🏗️ Architecture

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with existing `exhibitors_prw_2025` table
- **Charts**: Recharts library for data visualization

### 📁 File Structure

```
src/
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx                     # Protected route layout with logout
│   │   ├── logout-button.tsx              # Logout component
│   │   └── events/nrf/page.tsx            # Main dashboard page
│   ├── login/
│   │   ├── page.tsx                       # Login page
│   │   ├── login-form.tsx                 # Login form component
│   │   └── actions.ts                     # Server actions for auth
│   ├── api/events/nrf/exhibitors/route.ts # API endpoint
│   ├── page.tsx                           # Root redirect to login
│   └── layout.tsx                         # App layout
├── lib/
│   ├── prisma.ts                          # Prisma client singleton
│   ├── tagging.ts                         # Categorization logic
│   └── hooks.ts                           # Custom React hooks
├── middleware.ts                          # Route protection middleware
└── generated/prisma/                      # Generated Prisma client
```

### 🔌 API Endpoints

#### GET `/api/events/nrf/exhibitors`

Query parameters:

- `q`: Search query (optional)
- `country`: Country filter - "France", "all", or specific country (default: "France")
- `candidate`: Filter for pants candidates - "1" or "0" (default: "0")
- `take`: Number of results per page (default: 50)
- `page`: Page number (default: 1)

Response:

```json
{
  "total": 1234,
  "items": [...],
  "facets": {
    "byCountry": [{"value": "France", "count": 45}, ...],
    "byCategory": [{"value": "fashion_brand_retail", "count": 23}, ...]
  }
}
```

### 🎨 UI Components

- **Header**: Page title and description
- **Filters**: Search input, country selector, candidate toggle, reset button
- **KPIs**: Four metric cards showing key statistics
- **Charts**: Two responsive bar charts with tooltips
- **Table**: Sortable, paginated data table with clickable rows
- **Side Panel**: Detailed company information modal

## Usage

### Authentication

1. **Login**: Visit `/` and enter credentials (default: neba/connections)
2. **Access**: After login, you'll be redirected to `/events/nrf`
3. **Logout**: Click the logout button in the header to end your session

### Dashboard Usage

1. **Default View**: Page loads with all countries filter active
2. **Search**: Type in the search box to find companies by name, activities, or markets
3. **Country Filter**: Use dropdown to switch between all countries, France, or specific countries
4. **Pants Candidates**: Toggle to show only companies relevant for apparel sales
5. **Explore Data**: Click table rows to see detailed company information
6. **Charts**: View country and category distributions
7. **KPIs**: Monitor key metrics at a glance

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL database with `exhibitors_prw_2025` table
- Environment variable `DATABASE_URL` set

### Setup

```bash
npm install
npx prisma generate
npm run dev
```

### Database

The app connects to an existing PostgreSQL database with the `exhibitors_prw_2025` table. The Prisma schema is already configured and the client is generated.

## Future Enhancements

- Export filtered results as CSV
- Remember filter state in URL query parameters
- Highlight France bar in country chart
- Add more event types beyond NRF Europe
- Implement advanced filtering options
- Add company comparison features
