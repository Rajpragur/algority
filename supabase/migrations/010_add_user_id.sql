-- Migration: Add user_id to coaching_sessions for user data ownership
-- Story: auth-1-1-database-migration-for-user-ownership
-- Date: 2026-01-09

-- Add nullable user_id column referencing Supabase Auth users
-- Nullable to support brownfield migration (existing sessions have no user)
ALTER TABLE coaching_sessions
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for query performance on user-scoped queries
-- This will be heavily used by RLS policies and data fetching
CREATE INDEX idx_coaching_sessions_user_id ON coaching_sessions(user_id);
