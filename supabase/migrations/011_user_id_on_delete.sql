-- Migration: Add ON DELETE SET NULL behavior to user_id foreign key
-- Story: auth-1-1-database-migration-for-user-ownership (code review fix)
-- Date: 2026-01-09
--
-- This ensures sessions are preserved (orphaned) when a user is deleted
-- rather than cascading deletion or causing FK constraint errors

-- Drop the existing foreign key constraint
ALTER TABLE coaching_sessions
DROP CONSTRAINT IF EXISTS coaching_sessions_user_id_fkey;

-- Re-add with ON DELETE SET NULL behavior
ALTER TABLE coaching_sessions
ADD CONSTRAINT coaching_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
