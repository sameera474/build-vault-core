# Supabase Backend Integration Guide

## Overview

This guide covers how ConstructTest Pro integrates with Supabase for a fully managed backend infrastructure.

## Architecture

```
┌─────────────────┐
│  React Frontend │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Client │  ← Authentication, Real-time, Storage
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Supabase Platform            │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐ │
│  │ PostgreSQL  │  │ Auth Service │ │
│  │  Database   │  │              │ │
│  └─────────────┘  └──────────────┘ │
│  ┌─────────────┐  ┌──────────────┐ │
│  │   Storage   │  │  Realtime    │ │
│  │   (S3-like) │  │  (WebSocket) │ │
│  └─────────────┘  └──────────────┘ │
│  ┌─────────────────────────────────┤
│  │     Edge Functions (Deno)       │
│  └─────────────────────────────────┘
└─────────────────────────────────────┘
```

---

## 1. Supabase Client Setup

### Installation
```bash
npm install @supabase/supabase-js
```

### Configuration

**File**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// NEVER expose service_role key to frontend!
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

### Environment Variables

**.env.local**:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (safe for frontend)
```

**⚠️ NEVER commit**:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ... (backend only!)
```

---

## 2. Authentication

### Auth Context

**File**: `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        ...userData,
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 3. Database Operations

### Best Practices

#### ✅ DO: Use RLS for Security

```typescript
// Frontend code - RLS automatically filters by company_id
const { data, error } = await supabase
  .from('test_reports')
  .select('*')
  .eq('status', 'approved');
// RLS ensures user only sees their company's reports
```

#### ❌ DON'T: Query All Data

```typescript
// BAD: Returns all reports (RLS will filter, but inefficient)
const { data } = await supabase
  .from('test_reports')
  .select('*');

// GOOD: Add filters
const { data } = await supabase
  .from('test_reports')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false })
  .limit(50);
```

#### ✅ DO: Use Pagination

```typescript
const PAGE_SIZE = 20;

const { data, error, count } = await supabase
  .from('test_reports')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

#### ✅ DO: Handle Errors

```typescript
try {
  const { data, error } = await supabase
    .from('test_reports')
    .insert({ /* data */ });
  
  if (error) throw error;
  
  toast.success('Report created successfully');
  return data;
} catch (error) {
  console.error('Error creating report:', error);
  toast.error(error.message);
}
```

---

## 4. Real-time Subscriptions

### Subscribe to Changes

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function TestReportsTable() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Initial fetch
    fetchReports();

    // Subscribe to changes
    const channel = supabase
      .channel('test_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'test_reports',
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchReports(); // Refresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('test_reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data || []);
  };

  return <table>{/* render reports */}</table>;
}
```

---

## 5. File Storage

### Upload Files

```typescript
async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### Download Files

```typescript
async function downloadReport(filePath: string) {
  const { data, error } = await supabase.storage
    .from('reports')
    .download(filePath);

  if (error) throw error;

  // Create download link
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filePath.split('/').pop() || 'download';
  a.click();
}
```

---

## 6. Edge Functions

### Create Edge Function

**File**: `supabase/functions/send-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { to, subject, body } = await req.json();

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Send email logic here
    // ...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Call Edge Function

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Test Report Approved',
    body: 'Your report has been approved.',
  },
});
```

---

## 7. Performance Optimization

### Use Indexes

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_test_reports_project_id ON test_reports(project_id);
CREATE INDEX idx_test_reports_status ON test_reports(status);
CREATE INDEX idx_test_reports_created_at ON test_reports(created_at DESC);
```

### Use Materialized Views

```sql
-- Create materialized view for expensive queries
CREATE MATERIALIZED VIEW monthly_stats AS
SELECT 
  company_id,
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS report_count,
  COUNT(DISTINCT project_id) AS project_count
FROM test_reports
GROUP BY company_id, DATE_TRUNC('month', created_at);

-- Refresh periodically
REFRESH MATERIALIZED VIEW monthly_stats;
```

### Cache Frequently Accessed Data

```typescript
import { useQuery } from '@tanstack/react-query';

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## 8. Security Best Practices

### ✅ Always Enable RLS

```sql
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
```

### ✅ Never Expose Service Role Key

```typescript
// ❌ NEVER DO THIS
const supabase = createClient(url, SERVICE_ROLE_KEY); // In frontend!

// ✅ DO THIS
const supabase = createClient(url, ANON_KEY); // In frontend
// Service role only in Edge Functions or backend
```

### ✅ Validate Input

```typescript
import { z } from 'zod';

const reportSchema = z.object({
  project_id: z.string().uuid(),
  test_type: z.string().min(1),
  test_date: z.string().datetime(),
  // ...
});

function createReport(data: unknown) {
  const validated = reportSchema.parse(data);
  return supabase.from('test_reports').insert(validated);
}
```

---

## 9. Testing

### Local Development

```bash
# Start local Supabase
npx supabase start

# Create migration
npx supabase migration new add_new_table

# Apply migrations
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > src/types/database.ts
```

---

## 10. Deployment

### Production Checklist

- [  ] All RLS policies tested
- [ ] Indexes created for performance
- [ ] Backup strategy configured
- [ ] Environment variables set
- [ ] Edge functions deployed
- [ ] Storage buckets configured
- [ ] Email templates customized
- [ ] Rate limiting configured

---

## Common Patterns

### Company-Scoped Query

```typescript
const { data } = await supabase
  .from('test_reports')
  .select(`
    *,
    projects(name, location),
    profiles!created_by(name)
  `)
  .order('created_at', { ascending: false });
```

### Batch Operations

```typescript
const { data, error } = await supabase
  .from('test_reports')
  .insert([
    { /* report 1 */ },
    { /* report 2 */ },
    { /* report 3 */ },
  ]);
```

### Soft Delete

```sql
-- Add deleted_at column
ALTER TABLE test_reports ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create view for active records
CREATE VIEW active_test_reports AS
SELECT * FROM test_reports WHERE deleted_at IS NULL;
```

```typescript
// Soft delete
await supabase
  .from('test_reports')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', reportId);

// Query active only
const { data } = await supabase
  .from('active_test_reports')
  .select('*');
```

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

**Last Updated**: November 26, 2025
**Version**: 1.0
