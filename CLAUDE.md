# CLAUDE.md - AI Assistant Guide for Sindoca

> **Purpose**: This document provides comprehensive guidance for AI assistants (like Claude) working on the Sindoca codebase. It covers architecture, conventions, development workflows, and best practices.

**Last Updated**: 2025-11-13
**Project Version**: 2.0.0
**Tech Stack**: Next.js 16 + React 18 + TypeScript + Supabase

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture & Directory Structure](#architecture--directory-structure)
4. [Key Patterns & Conventions](#key-patterns--conventions)
5. [Development Workflows](#development-workflows)
6. [Database Schema](#database-schema)
7. [API Routes & Endpoints](#api-routes--endpoints)
8. [Common Tasks & Examples](#common-tasks--examples)
9. [Testing & Debugging](#testing--debugging)
10. [Deployment & Environment](#deployment--environment)
11. [Gotchas & Important Notes](#gotchas--important-notes)

---

## 📱 Project Overview

**Sindoca** is a sophisticated romantic PWA (Progressive Web App) designed for intimate relationship management between two people. It's a production-ready application with real-time features, push notifications, and comprehensive media handling.

### Core Features

- 💑 **Multi-tenant Workspace Model**: Each couple shares one workspace
- 🔄 **Real-time Synchronization**: Via Supabase Realtime subscriptions
- 📸 **Rich Media**: Photo galleries, voice recordings, Spotify integration
- 🔔 **Push Notifications**: Web Push (with native app prep for Expo)
- 😀 **Emoji Reactions**: Custom emoji system for content interaction
- 🎨 **Mobile-First Design**: Glassmorphism, gestures, haptic feedback
- 🔐 **Row-Level Security**: All data protected by Supabase RLS policies
- ⚙️ **Admin Controls**: Page visibility toggles via PageConfigContext

### Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend** | Next.js | 16.0.1 | App framework (App Router) |
| | React | 18.3.0 | UI library |
| | TypeScript | 5.9.3 | Type safety (⚠️ `strict: false`) |
| | Tailwind CSS | 3.4.1 | Utility-first styling |
| | Framer Motion | 11.0.0 | Animations & gestures |
| **Backend** | Supabase | 2.78.0 | BaaS (DB + Auth + Storage + Realtime) |
| | PostgreSQL | - | Relational database |
| **Push** | web-push | 3.6.7 | Web Push Protocol (VAPID) |
| **Music** | spotify-web-api-node | 5.0.2 | Spotify API integration |
| **UI** | Lucide React | 0.344.0 | Icons |
| | Sonner | 2.0.7 | Toast notifications |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- Spotify Developer account (for music features)

### Development Commands

```bash
# Start dev server (accessible on local network)
npm run dev              # Runs on 0.0.0.0:3000

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint

# Utility scripts
npm run check-push       # Check push subscriptions
npm run update-avatars   # Update user avatars
npm run check-avatars    # Check avatar status
```

### Environment Variables

Create `.env.local` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# VAPID (Web Push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public
VAPID_PRIVATE_KEY=your_vapid_private

# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback

# Internal API
INTERNAL_API_SECRET=your_random_secret
```

---

## 🏗️ Architecture & Directory Structure

### Root Structure

```
/home/user/sindoca_2/
├── app/                      # Next.js 13+ App Router (pages & API routes)
├── components/               # React components (sections, UI, widgets)
├── contexts/                 # React Context providers (Auth, PageConfig)
├── hooks/                    # Custom React hooks
├── lib/                      # Business logic, utilities, integrations
├── public/                   # Static assets (images, icons, sw.js)
├── supabase/                 # Database migrations
├── config/                   # Configuration files
├── scripts/                  # Utility scripts
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind customization
├── tsconfig.json             # TypeScript config
└── next.config.js            # Next.js config
```

### App Directory (Next.js App Router)

```
app/
├── layout.jsx                          # Root layout (providers, metadata)
├── page.jsx                            # Home page (dashboard)
├── globals.css                         # Global styles
│
├── (main pages)
│   ├── galeria/page.jsx                # Photo gallery with masonry grid
│   ├── razoes/page.jsx                 # Love reasons list
│   ├── mensagens/page.jsx              # Messages with reactions
│   ├── musica/page.jsx                 # Spotify integration
│   ├── conquistas/page.jsx             # Achievements timeline
│   ├── surpresas/page.jsx              # Surprises section
│   ├── legado/page.jsx                 # Legacy content
│   └── dashboard/page.tsx              # Admin dashboard
│
├── auth/                               # Authentication flow
│   ├── layout.tsx                      # Auth-specific layout
│   ├── login/page.tsx                  # Login page
│   ├── join/[code]/page.tsx            # Join with invite code
│   └── callback/route.ts               # OAuth callback
│
└── api/                                # API routes (Next.js Route Handlers)
    ├── auth/verify-invite/route.ts     # Invite code verification
    ├── push/                           # Push notification endpoints
    ├── reactions/notify/route.ts       # Reaction notifications
    └── spotify/                        # Spotify OAuth & API
```

### Components Organization

```
components/
├── sections/                           # Main page sections
│   ├── HomeSection.jsx                 # Landing/hero
│   ├── GallerySection.jsx              # Photo grid
│   ├── LoveReasonsSection.jsx          # Love reasons cards
│   ├── MusicSection.jsx                # Spotify player
│   ├── AchievementsSection.jsx         # Timeline
│   ├── MessagesSection.jsx             # Messages list
│   └── LegacySection.jsx               # Legacy content
│
├── ui/                                 # Reusable UI components
│   ├── Button.jsx                      # Button primitive
│   ├── Modal.jsx                       # Modal dialog
│   ├── BottomSheet.jsx                 # Mobile bottom sheet
│   ├── PhotoMenu.jsx                   # Photo options menu
│   ├── ReactionMenu.jsx                # Emoji reaction picker
│   ├── MasonryGrid.jsx                 # Masonry layout
│   ├── LoadingSkeleton.tsx             # Skeleton loaders
│   ├── PullToRefresh.tsx               # Pull-to-refresh
│   └── ReactableContent.jsx            # Content with reactions
│
├── auth/                               # Auth-specific components
│   ├── ProtectedRoute.tsx              # Route guard
│   └── PageAccessGuard.jsx             # Page-level access control
│
├── AppProvider.jsx                     # Global app state & service worker
├── BottomTabBar.jsx                    # Mobile bottom navigation
├── NavigationSidebar.jsx               # Desktop sidebar
├── Lightbox.jsx                        # Photo lightbox viewer
└── ErrorBoundary.tsx                   # Error boundary
```

### Custom Hooks

```
hooks/
├── usePushNotifications.jsx            # Web Push API integration
├── useRealtimePhotos.js                # Photos with Supabase Realtime
├── useRealtimeMessages.js              # Messages with Realtime
├── useRealtimeTable.js                 # Generic Realtime table hook
├── useReactions.js                     # Emoji reactions
├── useSpotify.js                       # Spotify API integration
├── usePageConfig.jsx                   # Page enable/disable admin
└── useSupabasePhotos.jsx               # Photo operations
```

### Lib Directory (Business Logic)

```
lib/
├── supabase/                           # Supabase client & utilities
│   ├── client.ts                       # Browser client (SSR-safe)
│   ├── server.ts                       # Server-side client
│   ├── photoOperations.js              # Photo CRUD operations
│   └── storage.backup.js               # Storage backup utilities
│
├── spotify/                            # Spotify integration
│   ├── client.ts                       # Spotify API client
│   └── auth.ts                         # OAuth helpers
│
├── api/                                # API helpers
│   ├── auth.ts                         # Auth API calls
│   ├── reactions.js                    # Reaction operations
│   └── customEmojis.js                 # Custom emoji management
│
├── push/                               # Push notifications
│   └── sendToPartner.ts                # Send notification to partner
│
└── utils/                              # Utility functions
    ├── logger.ts                       # Logging utility
    ├── imageCompression.js             # Image compression
    └── heartbeat.js                    # App health monitor
```

---

## 🎯 Key Patterns & Conventions

### Component Organization Philosophy

**Separation by feature and type**:
- **sections/**: Page-level feature components
- **ui/**: Reusable, atomic UI primitives
- **Specialized folders**: Domain-specific (auth/, music/, stories/)

```jsx
// ✅ Good: Feature-based organization
components/music/SpotifySearchModal.jsx
components/voice/VoiceRecorder.tsx

// ❌ Avoid: Flat structure
components/SpotifySearchModal.jsx
```

### State Management Architecture

**Multi-layered approach** (no Redux/Zustand):

1. **Local State** (`useState`, `useReducer`) - Component-level
2. **Context API** - Cross-cutting concerns:
   - `AuthContext` - User authentication & profile
   - `PageConfigContext` - Admin page visibility controls
   - `AppContext` - Theme, service worker, push notifications
3. **Supabase Realtime** - Server state synchronization
4. **URL State** (`useSearchParams`) - Navigation state

### Data Fetching Patterns

**Pattern 1: Realtime Hooks** (Primary pattern)

```javascript
// Custom hook with Supabase Realtime subscription
const { photos, loading, error, toggleFavorite } = useRealtimePhotos();

// Benefits:
// - Auto-sync across devices
// - Optimistic UI updates
// - Built-in loading/error states
```

**Pattern 2: Server Components** (Where appropriate)

```tsx
// app/dashboard/page.tsx - Server component
async function DashboardPage() {
  const supabase = await createClient(); // Server-side
  const { data } = await supabase.from('analytics').select('*');
  return <Dashboard data={data} />;
}
```

**Pattern 3: API Routes for Mutations**

```typescript
// POST /api/push/send - Server-side operation
await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, body, recipientUserId })
});
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│  AuthContext (contexts/AuthContext.tsx)                 │
│  - Manages user session                                 │
│  - Fetches user profile from Supabase                   │
│  - Provides signOut()                                   │
│  - Auto-refreshes tokens                                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Authentication Methods:                                │
│  1. Email/Password (Supabase Auth)                      │
│  2. Invite Code System (custom workspace join logic)    │
│  3. Spotify OAuth (via API routes)                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Protected Routes:                                      │
│  - ProtectedRoute.tsx wrapper                           │
│  - Checks auth in useEffect, redirects to /auth/login   │
│  - All main pages require authentication                │
└─────────────────────────────────────────────────────────┘
```

**Key Files**:
- `/home/user/sindoca_2/contexts/AuthContext.tsx:1` - Auth provider
- `/home/user/sindoca_2/app/auth/login/page.tsx:1` - Login UI
- `/home/user/sindoca_2/components/auth/ProtectedRoute.tsx:1` - Route guard

### Workspace Model (Multi-tenant)

**Concept**: Each couple shares ONE workspace

- **Creator** creates workspace with invite code + secret question
- **Partner** joins using invite code + correct answer
- All content belongs to workspace (not individual users)
- Both users have equal access (no ownership hierarchy)

**Database flow**:
```sql
workspaces (id, invite_code, secret_question, secret_answer_hash)
   ↓
workspace_members (workspace_id, user_id, role)
   ↓
content (id, workspace_id, author_id, type, data)
   ↓
reactions (content_id, user_id, type, emoji)
```

### Naming Conventions

**Files & Folders**:
- Components: `PascalCase.jsx` or `.tsx` (e.g., `BottomTabBar.jsx`)
- Hooks: `camelCase.js` starting with `use` (e.g., `usePushNotifications.jsx`)
- Utils: `camelCase.js` or `.ts` (e.g., `imageCompression.js`)
- API Routes: `route.ts` (Next.js convention)
- Pages: `page.jsx` or `page.tsx` (Next.js convention)

**Variables & Functions**:

```javascript
// ✅ Good
const userId = user.id;
const handleSubmit = async () => {};
const isLoading = true;

// ❌ Avoid
const UserID = user.id;
const submit = () => {}; // Unclear intent
const loading = true; // Use "is" prefix for booleans
```

**TypeScript Types**:

```typescript
// Interfaces for data models
interface Profile {
  id: string;
  email: string;
  full_name: string;
}

// Type for component props
type ButtonProps = {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
};
```

---

## 🎨 Styling Approach

### Tailwind Configuration

**Custom Design System** (`/home/user/sindoca_2/tailwind.config.js:1`):

```javascript
colors: {
  primary: '#FF6B9D',        // Pink
  secondary: '#FFD93D',      // Yellow
  accent: '#6BCF7F',         // Green
  lavender: '#7B68EE',       // Purple
  background: '#FAFAFA',     // Light gray
  textPrimary: '#2D2D2D',    // Dark gray
  // ... dark mode variants
}

fontFamily: {
  heading: ['Poppins', 'Inter'],
  body: ['Inter', '-apple-system'],
  handwriting: ['Caveat', 'Patrick Hand'],
}

boxShadow: {
  'soft-sm': '0 2px 4px rgba(0,0,0,0.06)',
  'glow-primary': '0 0 20px rgba(255,107,157,0.3)',
}
```

### CSS Organization

1. **Tailwind Utilities** - Primary styling method (90%)
2. **Global CSS** (`app/globals.css`) - Base styles, scrollbar
3. **Component-scoped styles** - Rare, only for complex animations
4. **CSS Variables** - Dynamic theming (`--primary-color`)

### Common Patterns

**Glassmorphism** (heavily used):
```jsx
className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-soft-lg"
```

**Responsive Design** (mobile-first):
```jsx
className="text-sm md:text-base lg:text-lg"
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
```

**Conditional Classes**:
```jsx
className={`
  base-classes
  ${isActive ? 'active-classes' : 'inactive-classes'}
`}
```

---

## 🔄 Development Workflows

### Realtime Hook Pattern

All realtime hooks follow this structure:

```javascript
export function useRealtimePhotos(pollInterval = 10000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Initial fetch
  useEffect(() => {
    loadData();
  }, []);

  // 2. Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('table-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        // Optimistic update
        setData(prev => ...);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { data, loading, error, refresh: loadData };
}
```

### API Route Pattern

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse & validate
    const body = await request.json();
    if (!body.required) {
      return NextResponse.json({ error: 'Missing field' }, { status: 400 });
    }

    // 3. Execute operation
    const result = await someOperation(body);

    // 4. Return success
    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Animation Patterns (Framer Motion)

```jsx
// 1. Fade-in on mount
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>

// 2. Button interactions
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>

// 3. Stagger children
<motion.div variants={container}>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariant} />
  ))}
</motion.div>
```

### UI Patterns

**Loading States**:
```jsx
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
{loading ? <LoadingSkeleton count={5} /> : <Content />}
```

**Toast Notifications** (Sonner):
```javascript
import { toast } from 'sonner';

toast.success('Photo uploaded!');
toast.error('Failed to save', { description: error.message });
toast.loading('Uploading...', { id: 'upload' });
toast.success('Done!', { id: 'upload' }); // Updates previous toast
```

**Haptic Feedback**:
```javascript
const triggerVibration = (duration = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

onClick={() => {
  triggerVibration(30);
  // ... action
}}
```

---

## 🗄️ Database Schema

### Core Tables

**1. profiles** (extends `auth.users`)
```sql
id          UUID (FK to auth.users)
email       TEXT
full_name   TEXT
nickname    TEXT
avatar_url  TEXT
bio         TEXT
birthday    DATE
theme       TEXT
```

**2. workspaces** (couple's shared workspace)
```sql
id                  UUID
invite_code         TEXT (unique, 6 chars)
secret_question     TEXT
secret_answer_hash  TEXT
creator_id          UUID (FK profiles)
partner_id          UUID (FK profiles, nullable)
status              'pending' | 'active'
max_attempts        INT (default 5)
```

**3. workspace_members** (join table)
```sql
workspace_id    UUID (FK workspaces)
user_id         UUID (FK profiles)
role            'creator' | 'partner'
joined_at       TIMESTAMPTZ
```

**4. content** (polymorphic content table)
```sql
id              UUID
workspace_id    UUID (FK workspaces)
author_id       UUID (FK profiles)
type            'photo' | 'message' | 'music' | 'achievement' | 'voice' | 'story'
title           TEXT
description     TEXT
data            JSONB (flexible metadata)
storage_path    TEXT (Supabase Storage path)
category        TEXT
created_at      TIMESTAMPTZ
```

**5. reactions** (emoji reactions & favorites)
```sql
id              UUID
content_id      UUID (FK content)
user_id         UUID (FK profiles)
type            'favorite' | 'emoji' | 'like'
emoji           TEXT (emoji character or custom emoji ID)
created_at      TIMESTAMPTZ
UNIQUE(content_id, user_id, type, emoji) -- Prevent duplicates
```

**6. push_subscriptions** (Web Push)
```sql
id          UUID
user_id     UUID (FK profiles)
endpoint    TEXT (unique)
keys        JSONB {p256dh, auth}
```

**7. spotify_tokens** (OAuth tokens)
```sql
user_id         UUID (FK profiles)
access_token    TEXT
refresh_token   TEXT
expires_at      TIMESTAMPTZ
```

### Row Level Security (RLS)

**All tables have RLS enabled**. Example policy:

```sql
-- Users can only see their workspace content
CREATE POLICY "Members can view workspace content"
  ON content FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

### Migrations

15+ migrations in `/home/user/sindoca_2/supabase/migrations/`:
- `001_initial_schema.sql` - Core tables
- `010_add_push_subscriptions.sql` - Web Push support
- `014_add_emoji_reactions.sql` - Reactions system

---

## 🌐 API Routes & Endpoints

### Authentication

- `POST /api/auth/verify-invite` - Verify invite code and secret answer
- `GET /api/auth/callback` - OAuth callback handler

### Push Notifications

- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/send` - Send push notification (web-push)
- `POST /api/push/send-expo` - Send Expo push (for future native app)

### Reactions

- `POST /api/reactions/notify` - Notify partner of new reaction

### Spotify

- `GET /api/spotify/auth` - Initiate Spotify OAuth flow
- `GET /api/spotify/callback` - Spotify OAuth callback
- `POST /api/spotify/refresh-token` - Refresh expired token
- `GET /api/spotify/search?q={query}` - Search Spotify tracks
- `POST /api/spotify/playlist/add-track` - Add track to playlist
- `DELETE /api/spotify/playlist/remove-track` - Remove track
- `POST /api/spotify/playlist/make-collaborative` - Make playlist collaborative

---

## 💼 Common Tasks & Examples

### Adding a New Page

1. **Create page component**:
```jsx
// app/nova-pagina/page.jsx
'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function NovaPagina() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <h1>Nova Página</h1>
      </div>
    </ProtectedRoute>
  );
}
```

2. **Add to navigation** in `/home/user/sindoca_2/components/BottomTabBar.jsx:1`

3. **Add to page config** (optional admin toggle):
```sql
INSERT INTO page_config (page_id, is_active) VALUES ('nova-pagina', true);
```

### Creating a Realtime Hook

```javascript
// hooks/useRealtimeExample.js
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeExample() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial load
    loadData();

    // Realtime subscription
    const channel = supabase
      .channel('example-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'your_table'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => [payload.new, ...prev]);
        }
        // Handle UPDATE, DELETE...
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadData() {
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setData(data);
    setLoading(false);
  }

  return { data, loading, refresh: loadData };
}
```

### Adding a Database Migration

```sql
-- supabase/migrations/017_add_new_feature.sql
CREATE TABLE IF NOT EXISTS new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view new_feature"
  ON new_feature FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

### Sending Push Notifications

```javascript
// From client-side
const response = await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New message!',
    body: 'Check out the new message from your partner',
    recipientUserId: partnerId,
    url: '/mensagens'
  })
});
```

---

## 🧪 Testing & Debugging

### Current State

⚠️ **No formal testing framework configured**
- No Jest, Vitest, or React Testing Library
- No E2E tests (Playwright, Cypress)
- Development relies on manual testing

### Debugging Tools

**Supabase Realtime Debug**:
```javascript
const channel = supabase
  .channel('debug')
  .on('postgres_changes', {}, (payload) => {
    console.log('Realtime event:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

**Logger Utility** (`/home/user/sindoca_2/lib/utils/logger.ts:1`):
```typescript
import { logger } from '@/lib/utils/logger';

logger.info('User action', { userId, action });
logger.error('Failed operation', { error, context });
```

---

## 🚀 Deployment & Environment

### Build Configuration

```javascript
// next.config.js
{
  images: { unoptimized: true },
  compress: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion']
  }
}
```

### PWA Features

- **Service Worker**: `/public/sw.js` (v6)
- **Manifest**: `/public/manifest.json`
- **Push Notifications**: Web Push API + VAPID keys
- **Installability**: iOS & Android support

### Performance Optimizations

- **Code Splitting**: Automatic via Next.js
- **Lazy Loading**: Dynamic imports for heavy components
- **Image Optimization**: `browser-image-compression` library
- **Virtual Scrolling**: `@tanstack/react-virtual` for long lists

---

## ⚠️ Gotchas & Important Notes

### Things to Know

1. **Workspace-centric model**: Everything belongs to a workspace (couple), not individual users
2. **Realtime-first**: Most data uses Supabase Realtime subscriptions
3. **Mobile-optimized**: Bottom tab bar, haptics, gestures are primary UX
4. **TypeScript is optional**: `strict: false` - types are hints, not enforced
5. **No state management library**: Context API + Supabase Realtime only
6. **Custom emoji system**: Users can upload custom emojis to workspace
7. **Admin features**: Creator can toggle page visibility via PageConfigContext
8. **Push notification gotcha**: iOS Web Push support is limited (iOS 16.4+)

### Common Patterns to Follow

```jsx
// 1. Always use motion for interactivity
import { motion } from 'framer-motion';
<motion.button whileTap={{ scale: 0.95 }}>

// 2. Always provide loading states
{loading ? <Skeleton /> : <Content />}

// 3. Always use toast for feedback
import { toast } from 'sonner';
toast.success('Action completed!');

// 4. Always handle auth guards
const { user, loading } = useAuth();
if (loading) return <Loader />;
if (!user) router.push('/auth/login');

// 5. Always optimize images
import { compressImage } from '@/lib/utils/imageCompression';
const compressed = await compressImage(file);
```

### Files Most Likely to Edit

**For new features**:
- `/home/user/sindoca_2/app/(new-page)/page.jsx`
- `/home/user/sindoca_2/components/sections/(NewSection).jsx`
- `/home/user/sindoca_2/hooks/use(NewFeature).js`

**For API integrations**:
- `/home/user/sindoca_2/app/api/(feature)/route.ts`
- `/home/user/sindoca_2/lib/api/(feature).ts`

**For styling**:
- `/home/user/sindoca_2/tailwind.config.js`
- `/home/user/sindoca_2/app/globals.css`

**For database**:
- `/home/user/sindoca_2/supabase/migrations/(new).sql`

### Security Best Practices

1. **Always use RLS policies** for new tables
2. **Validate input** in API routes before database operations
3. **Never expose secrets** in client-side code
4. **Use server-side Supabase client** for sensitive operations
5. **Hash sensitive data** (like secret answers) using bcryptjs

### Code Quality Guidelines

1. **Mobile-first**: Always test on mobile viewport first
2. **Error boundaries**: Wrap async operations in try-catch
3. **Loading states**: Every async operation should have loading UI
4. **Haptic feedback**: Add vibration for button interactions
5. **Toast notifications**: Use for all user feedback
6. **Cleanup subscriptions**: Always unsubscribe in useEffect cleanup
7. **Optimize images**: Always compress before upload

---

## 📚 Additional Documentation

### Migration Documentation

The codebase includes a comprehensive guide for converting to React Native:

**File**: `/home/user/sindoca_2/MIGRACAO_APP_NATIVO.md`

**Key Points**:
- Expo SDK 52 recommended
- Expo Notifications (no Firebase needed)
- StyleSheet native (no NativeWind)
- 100% free distribution via EAS Build
- ~80% code reusability

### Bottom Tab Bar Refactoring

**File**: `/home/user/sindoca_2/bottom-tab.md`

Contains detailed guide for iOS/Android-specific styling of the bottom tab bar.

### README

**File**: `/home/user/sindoca_2/README.md`

General project overview and setup instructions (in Portuguese).

---

## 🎯 Summary

**Sindoca** is a production-ready, sophisticated romantic PWA with:
- ✅ Comprehensive authentication & authorization (RLS)
- ✅ Real-time synchronization across devices
- ✅ Rich media handling (photos, voice, music)
- ✅ Push notifications (Web Push + Expo prep)
- ✅ Mobile-first responsive design
- ✅ Smooth animations & interactions
- ✅ Spotify OAuth integration
- ✅ Custom emoji reactions system
- ✅ Admin controls for feature toggles

**Code Quality**: Clean, well-organized, follows Next.js best practices, extensive use of custom hooks for reusability.

**Tech Debt**: Minimal - main areas for improvement:
- Add formal testing (Jest + React Testing Library)
- Enable TypeScript `strict` mode
- Add E2E tests for critical flows
- Consider React Query for server state (optional)

---

**This guide should provide everything needed to effectively work on the Sindoca codebase. All file paths are absolute and can be directly referenced.**
