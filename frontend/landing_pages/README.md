# Landing Pages Server

Node.js Express server for static marketing pages, blog, and SEO content.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Server runs on http://localhost:3001

## Routes

- `/` - Homepage
- `/about` - About page
- `/features` - Features page
- `/pricing` - Pricing page
- `/blog` - Blog listing
- `/blog/:slug` - Individual blog post

## API Proxy

Public API endpoints can be proxied through `/api/public/*` to Django backend.

## Notes

- This server does NOT require authentication
- It can fetch public data from Django API when needed
- Views are rendered server-side using EJS templates
- Static assets are served from `/public` directory

