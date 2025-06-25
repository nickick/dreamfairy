#!/bin/bash

echo "DreamFairy Database Setup"
echo "========================"
echo ""
echo "This script will create the necessary tables and policies in your Supabase database."
echo ""
echo "Prerequisites:"
echo "1. You need to have the Supabase CLI installed:"
echo "   - macOS: brew install supabase/tap/supabase"
echo "   - Windows: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase"
echo "   - Linux: Download from https://github.com/supabase/cli/releases"
echo "2. You need to be logged in to Supabase CLI (supabase login)"
echo "3. You need to have your Supabase project linked (supabase link --project-ref YOUR_PROJECT_REF)"
echo ""
echo "Alternatively, you can run the SQL directly in the Supabase Dashboard SQL Editor."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it with:"
    echo "  - macOS: brew install supabase/tap/supabase"
    echo "  - Or visit: https://github.com/supabase/cli#install"
    exit 1
fi

# Ask for confirmation
read -p "Do you want to run the schema setup? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running database schema..."
    
    # Run the schema using supabase db execute
    cat ./supabase/schema.sql | supabase db execute
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database schema created successfully!"
        echo ""
        echo "Your database now has:"
        echo "- stories table: for storing story sessions"
        echo "- story_nodes table: for storing individual story steps"
        echo "- story_choices table: for storing available choices"
        echo "- Row Level Security policies to ensure data privacy"
        echo ""
        echo "You can now start saving stories in your DreamFairy app!"
    else
        echo ""
        echo "❌ Error creating database schema."
        echo ""
        echo "You can also run the SQL manually:"
        echo "1. Go to your Supabase Dashboard"
        echo "2. Navigate to SQL Editor"
        echo "3. Copy and paste the contents of supabase/schema.sql"
        echo "4. Click 'Run'"
    fi
else
    echo "Setup cancelled."
fi