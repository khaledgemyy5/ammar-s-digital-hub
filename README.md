# Ammar Jaber - Personal Brand Hub

A minimalist, text-first personal portfolio website built with React, TypeScript, and Supabase.

## Features

- **Public Site**: Home, Projects, Writing, Resume, Contact pages
- **Admin Dashboard**: Full CMS for managing all content
- **Dynamic Navigation**: Auto-hides empty pages
- **RTL Support**: Arabic content support with proper text direction
- **Analytics**: Track page views, downloads, and clicks
- **SEO**: Configurable meta tags and OG images

## Quick Start

### 1. Set Environment Variables

In Lovable, go to **Settings > Secrets** and add:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |

**Where to find these:**
1. Go to [supabase.com](https://supabase.com) and open your project
2. Navigate to **Settings > API**
3. Copy the "Project URL" and "anon public" key

### 2. Initialize Database Schema

1. Open your Supabase project
2. Go to **SQL Editor**
3. Copy and paste the contents of `docs/sql/000_all.sql`
4. Click **Run** to execute

This creates all tables, functions, triggers, and initial seed data.

### 3. Create Admin User

1. In Supabase, go to **Authentication > Users**
2. Click **Add User > Create New User**
3. Enter your email and a strong password
4. Click **Create User**

### 4. Set Bootstrap Token

1. Go to **SQL Editor** in Supabase
2. Run this command (replace `your-secret-token` with a secure token):
   ```sql
   SELECT public.set_bootstrap_token('your-secret-token');
   ```
3. Save this token - you'll need it in the next step

### 5. Claim Admin Access

1. Visit your app at `/admin/login`
2. Log in with your email/password from step 3
3. You'll be redirected to `/admin/setup`
4. Enter your bootstrap token from step 4
5. Click **Claim Admin**

### 6. Seed Demo Content (Optional)

1. Go to `/admin/status`
2. Click **Seed Demo Content**
3. This adds sample projects, writing items, and settings

## Project Structure

```
src/
├── components/
│   ├── admin/        # Admin-specific components
│   ├── layout/       # Navbar, Footer, MainLayout
│   ├── sections/     # Home page sections
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── lib/              # Utilities (db, analytics, supabase)
├── pages/
│   ├── admin/        # Admin dashboard pages
│   └── *.tsx         # Public pages
└── types/            # TypeScript types
```

## Admin Dashboard Pages

| Page | Description |
|------|-------------|
| `/admin/dashboard` | Overview with stats and quick actions |
| `/admin/home-layout` | Reorder and toggle home sections |
| `/admin/projects` | Manage projects (CRUD, publish, feature) |
| `/admin/writing` | Manage writing categories and items |
| `/admin/pages` | Enable/disable Resume and Contact pages |
| `/admin/theme` | Accent color, font, and mode settings |
| `/admin/seo` | Site title, description, OG image |
| `/admin/analytics` | View site analytics |
| `/admin/settings` | Navigation links configuration |
| `/admin/status` | Connection tests and seed demo data |

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Animation**: Framer Motion
- **State**: React Query, Context API

## Design Principles

- **Minimalist**: Text-first, no unnecessary images
- **Professional**: IBM Plex Serif + Inter fonts
- **Fast**: Caching, lazy loading, skeleton states
- **Accessible**: Semantic HTML, keyboard navigation
- **Secure**: RLS policies, input validation

## Security

- Row Level Security (RLS) on all tables
- Single admin user via bootstrap token
- No sensitive data in client code
- Input sanitization on all forms

## Customization

### Accent Color
Default: `#135BEC` (Bold Blue)

Change in Admin > Theme or directly in `src/index.css`:
```css
--primary: 220 88% 50%;
```

### Fonts
Options: Inter, IBM Plex Serif, System

Change in Admin > Theme.

## Deployment

1. In Lovable, click **Share > Publish**
2. Your site will be live at the provided URL
3. Optional: Connect a custom domain in **Settings > Domains**

## Troubleshooting

### "Supabase Not Configured" Error
- Check that environment variables are set correctly
- Ensure no typos in the URL or key

### "Schema Not Initialized" Warning
- Run `docs/sql/000_all.sql` in Supabase SQL Editor
- Make sure the script completed without errors

### "Access Forbidden" on Admin
- You're logged in but not the admin user
- Run `SELECT admin_user_id FROM site_settings;` to check
- If null, you need to bootstrap with token

### Projects/Writing Not Showing
- Check if items are marked as `published: true` / `enabled: true`
- Run seed demo data from `/admin/status`

## License

MIT
