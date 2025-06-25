# DreamFairy Database Setup

This directory contains the database schema for the DreamFairy application.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to the **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the entire contents of `schema.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Option 2: Using the Setup Script

Run the provided setup script:

```bash
./scripts/setup-database.sh
```

### Option 3: Using Supabase CLI

First install Supabase CLI:
- **macOS**: `brew install supabase/tap/supabase`
- **Windows**: Use scoop (see [installation guide](https://github.com/supabase/cli#install))
- **Linux**: Download from [releases](https://github.com/supabase/cli/releases)

Then run:
```bash
supabase db push ./supabase/schema.sql
```

## What Gets Created

The schema creates the following tables:

### 1. `stories` table
- Stores main story sessions
- Fields: id, user_id, seed, title, is_completed, created_at, updated_at

### 2. `story_nodes` table
- Stores individual story steps
- Fields: id, story_id, node_index, story_text, choice_made, image_url, narration_url, created_at

### 3. `story_choices` table
- Stores available choices for each node
- Fields: id, node_id, choice_text, choice_index

## Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- Users can only see their own stories
- Users can only create/update/delete their own data
- Anonymous users can also save stories (their user_id will be their anonymous auth id)

## Troubleshooting

If you encounter any errors:

1. **"permission denied for schema public"**
   - Make sure you're running the SQL as a database owner/admin
   - In Supabase Dashboard, you're automatically authenticated correctly

2. **"relation already exists"**
   - The tables may already exist. You can drop them first with:
   ```sql
   DROP TABLE IF EXISTS story_choices CASCADE;
   DROP TABLE IF EXISTS story_nodes CASCADE;
   DROP TABLE IF EXISTS stories CASCADE;
   ```

3. **RLS Policy Errors**
   - If policies already exist, you can drop them:
   ```sql
   DROP POLICY IF EXISTS "Users can view own stories" ON stories;
   -- Repeat for other policies
   ```

## Next Steps

After setting up the database:

1. Make sure your `.env.local` file has the correct Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. The app will automatically start saving stories as users play

3. Check the **Table Editor** in Supabase Dashboard to see the saved data