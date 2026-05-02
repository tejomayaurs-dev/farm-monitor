# Farm Monitor PWA

An offline-first Progressive Web App for organic farm plant monitoring.

## Stack
- Next.js 16 (App Router)
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Dexie.js (IndexedDB)
- Zustand (State Management)
- next-pwa (Service Worker)

## Setup & Deployment

1. **Create Supabase Project:**
   - Go to [Supabase](https://supabase.com) and create a project.
   - Run the SQL script found in `supabase/schema.sql` in the Supabase SQL editor.
   - For Phone OTP auth, configure Twilio under **Authentication > Providers > Phone**.

2. **Environment Variables:**
   Create a `.env.local` for local dev or add these to your Vercel project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # Set to "demo" to bypass real auth and load demo data seeds:
   NEXT_PUBLIC_AUTH_MODE=demo 
   ```

3. **Deploy to Vercel:**
   - Push this repository to GitHub.
   - Import the project into Vercel.
   - Add the environment variables above.
   - Deploy.

## Local Dev
```bash
npm install
npm run dev
```

## PWA Note
In development (`npm run dev`), the service worker is disabled to prevent caching issues during hot module replacement. To test PWA features locally:
```bash
npm run build
npm run start
```
