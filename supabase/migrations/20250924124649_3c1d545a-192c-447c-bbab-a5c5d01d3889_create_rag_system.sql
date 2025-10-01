-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create policy_embeddings table for storing Notion content with embeddings
CREATE TABLE policy_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- For text-embedding-3-small model (1536 dimensions)
  metadata JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on notion_page_id for fast lookups
CREATE INDEX idx_policy_embeddings_notion_page_id ON policy_embeddings(notion_page_id);

-- Create index on last_updated for sync operations
CREATE INDEX idx_policy_embeddings_last_updated ON policy_embeddings(last_updated);

-- Create vector index for efficient similarity search
CREATE INDEX idx_policy_embeddings_embedding ON policy_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create similarity search function
CREATE OR REPLACE FUNCTION similarity_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.1,
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  notion_page_id TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.notion_page_id,
    pe.title,
    pe.content,
    pe.metadata,
    (1 - (pe.embedding <=> query_embedding)) as similarity
  FROM policy_embeddings pe
  WHERE (1 - (pe.embedding <=> query_embedding)) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to update the last_updated timestamp
CREATE OR REPLACE FUNCTION update_policy_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_updated on row changes
CREATE TRIGGER trigger_update_policy_embedding_timestamp
  BEFORE UPDATE ON policy_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_embedding_timestamp();

-- Create RAG system status table for monitoring
CREATE TABLE rag_system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL, -- 'sync', 'search', 'generation'
  status TEXT NOT NULL, -- 'success', 'error', 'in_progress'
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for monitoring queries
CREATE INDEX idx_rag_system_status_operation_type ON rag_system_status(operation_type);
CREATE INDEX idx_rag_system_status_created_at ON rag_system_status(created_at);
CREATE INDEX idx_rag_system_status_status ON rag_system_status(status);

-- Create view for system statistics
CREATE VIEW rag_system_stats AS
SELECT
  (SELECT COUNT(*) FROM policy_embeddings) as total_policies,
  (SELECT COUNT(*) FROM rag_system_status WHERE status = 'success' AND operation_type = 'sync') as successful_syncs,
  (SELECT COUNT(*) FROM rag_system_status WHERE status = 'error') as total_errors,
  (SELECT MAX(created_at) FROM policy_embeddings) as last_policy_update,
  (SELECT MAX(created_at) FROM rag_system_status WHERE operation_type = 'sync') as last_sync_attempt;

-- Grant necessary permissions (adjust as needed for your RLS policies)
-- These grants assume you're using Supabase's default RLS setup
GRANT SELECT, INSERT, UPDATE ON policy_embeddings TO authenticated;
GRANT SELECT, INSERT ON rag_system_status TO authenticated;

