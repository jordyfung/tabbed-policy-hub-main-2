# RAG System Setup Guide

## Current Issues Fixed

### 1. Missing Environment Variables
Your `.env` file is missing critical Notion API configuration. Add these lines:

```bash
# Add to your .env file
VITE_NOTION_API_KEY=your_actual_notion_api_key_here
VITE_NOTION_DATABASE_ID=your_actual_notion_database_id_here
```

### 2. How to Get Notion API Keys

#### Step 1: Create Notion Integration
1. Go to https://developers.notion.com/
2. Click "New integration"
3. Fill in integration name (e.g., "Policy Hub RAG")
4. Select your workspace
5. Copy the "Internal Integration Token" - this is your `VITE_NOTION_API_KEY`

#### Step 2: Get Database ID
1. Open your Notion database in browser
2. Copy the URL - it looks like: `https://www.notion.so/your-workspace/database-id?v=...`
3. Extract the database ID from the URL (the long string before `?v=`)
4. This is your `VITE_NOTION_DATABASE_ID`

#### Step 3: Share Database with Integration
1. In your Notion database, click "Share" in top-right
2. Click "Invite" and search for your integration name
3. Select "Can edit" permissions
4. Click "Invite"

### 3. Server-Side Environment Variables (Supabase)
In Supabase Dashboard → Settings → Edge Functions → Environment Variables, add:

```
NOTION_API_KEY=your_actual_notion_api_key_here
OPENAI_API_KEY=your_actual_openai_api_key_here
SUPABASE_URL=your_actual_supabase_url_here
SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

### 4. Test Database Setup
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Check if tables exist
SELECT COUNT(*) FROM policy_embeddings;
SELECT * FROM rag_system_stats;

-- If tables don't exist, run the migration
-- (This should already be done, but just in case)
```

### 5. Deploy Edge Function
Make sure the `rag-api` Edge Function is deployed:

```bash
# In your project root
supabase functions deploy rag-api
```

## Improvements Made

### 1. Better RAG Service (`ragServiceImproved.ts`)
- Uses pgvector for efficient similarity search
- Proper error handling and logging
- Better confidence scoring

### 2. Improved Chat Interface (`chat-interface-improved.tsx`)
- Better error handling and user feedback
- System readiness checks
- Retry functionality
- Confidence indicators
- Source attribution

### 3. Enhanced User Experience
- Clear error messages when system isn't ready
- Visual indicators for system status
- Processing time display
- Source links to Notion pages

## Testing the System

### 1. Test Sync
1. Go to Admin → RAG System Management
2. Click "Sync Now" in the Data Sync tab
3. Check for success/error messages

### 2. Test Chat
1. Go to Policies tab
2. Click the bouncing AI assistant button
3. Ask a question about your policies
4. Check if you get relevant responses

### 3. Monitor System
1. Check the System Test tab for diagnostics
2. View monitoring data in the Monitoring tab

## Troubleshooting

### Common Issues

1. **"RAG system is not ready"**
   - Ensure environment variables are set
   - Run sync to populate database
   - Check Supabase Edge Function is deployed

2. **"NOTION_API_KEY not configured"**
   - Add server-side environment variables in Supabase
   - Ensure integration has access to database

3. **"No embeddings found"**
   - Run sync process
   - Check if Notion database has content
   - Verify database permissions

4. **401 Unauthorized errors**
   - Check Notion API key is correct
   - Ensure integration has database access
   - Verify database ID is correct

## Next Steps (Optional Improvements)

### Option 1: Third-Party RAG (Recommended for Scale)
- **Pinecone**: Managed vector database
- **LangChain**: Better RAG pipeline
- **Retool/Voiceflow**: No-code chatbot

### Option 2: Enhanced Current System
- Add caching for better performance
- Implement streaming responses
- Add conversation memory
- Better source formatting

## Support
If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test sync functionality first
4. Check Supabase logs for Edge Function errors
