# RAG Database Implementation Plan - Notion Integration

## Executive Summary

This document outlines the implementation plan for creating a Retrieval-Augmented Generation (RAG) system that extracts policy content from your Notion database and integrates it with your existing chat interface. The goal is to replace the current mock AI responses with contextually relevant answers based on your actual policy documentation.

## Current State Analysis

### Existing Infrastructure
- **Frontend**: React/TypeScript application with chat interface
- **Backend**: Supabase with PostgreSQL
- **Notion Integration**: Currently embedded via iframe (read-only)
- **Chat System**: Mock implementation with hardcoded responses

### Key Challenges
- No programmatic access to Notion content
- No vector database for semantic search
- No real AI integration with policy context

## Implementation Phases

### Phase 1: Preparation and Setup (1-2 days)

#### 1.1 Notion API Integration Setup
**Objective**: Establish secure API access to Notion database

**Steps**:
1. Create Notion integration at [developers.notion.com](https://developers.notion.com)
2. Obtain integration token and database ID
3. Grant integration access to your policy database
4. Test API connectivity

**Deliverables**:
- Notion integration token stored securely
- Database ID identified
- Basic API connection test

**Risks**: Notion API rate limits, token security

#### 1.2 Environment Setup
**Objective**: Configure development environment with required dependencies

**Dependencies to Install**:
```bash
npm install @notionhq/client openai @supabase/supabase-js
```

**Environment Variables Required**:
```env
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 1.3 Supabase Vector Database Setup
**Objective**: Enable pgvector extension and create necessary tables

**SQL Commands**:
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create RAG content table
CREATE TABLE policy_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- For text-embedding-3-small
  metadata JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM policy_embeddings pe
  WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create vector index for performance
CREATE INDEX ON policy_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### Phase 2: Core Services Development (3-4 days)

#### 2.1 Notion Data Extraction Service
**Objective**: Build robust service to extract and process Notion content

**Key Components**:

**File**: `src/services/notionExtractor.ts`
```typescript
import { Client } from '@notionhq/client';
import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  metadata: any;
  lastEdited: string;
}

export class NotionExtractor {
  private notion: Client;
  private openai: OpenAI;

  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_API_KEY
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async extractAllPages(databaseId: string): Promise<NotionPage[]> {
    const pages = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response = await this.notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: 100,
      });

      for (const page of response.results) {
        if ('properties' in page) {
          const pageData = await this.extractPageData(page);
          pages.push(pageData);
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return pages;
  }

  private async extractPageData(page: any): Promise<NotionPage> {
    const title = this.extractTitle(page);
    const content = await this.extractPageContent(page.id);
    const metadata = this.extractMetadata(page);

    return {
      id: page.id,
      title,
      content,
      metadata,
      lastEdited: page.last_edited_time,
    };
  }

  private extractTitle(page: any): string {
    const titleProperty = page.properties.Name || page.properties.Title;
    if (titleProperty?.title?.[0]?.plain_text) {
      return titleProperty.title[0].plain_text;
    }
    return 'Untitled Page';
  }

  private async extractPageContent(pageId: string): Promise<string> {
    const blocks = await this.notion.blocks.children.list({
      block_id: pageId,
    });

    let content = '';
    for (const block of blocks.results) {
      content += this.processBlock(block) + '\n';
    }

    return content.trim();
  }

  private processBlock(block: any): string {
    if (!('type' in block)) return '';

    switch (block.type) {
      case 'paragraph':
        return block.paragraph.rich_text.map((rt: any) => rt.plain_text).join('');
      case 'heading_1':
        return `# ${block.heading_1.rich_text.map((rt: any) => rt.plain_text).join('')}`;
      case 'heading_2':
        return `## ${block.heading_2.rich_text.map((rt: any) => rt.plain_text).join('')}`;
      case 'heading_3':
        return `### ${block.heading_3.rich_text.map((rt: any) => rt.plain_text).join('')}`;
      case 'bulleted_list_item':
        return `• ${block.bulleted_list_item.rich_text.map((rt: any) => rt.plain_text).join('')}`;
      case 'numbered_list_item':
        return `1. ${block.numbered_list_item.rich_text.map((rt: any) => rt.plain_text).join('')}`;
      default:
        return '';
    }
  }

  private extractMetadata(page: any): any {
    return {
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      properties: page.properties,
    };
  }

  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  }

  async processAndStorePages(pages: NotionPage[]): Promise<void> {
    for (const page of pages) {
      try {
        // Check if page already exists
        const { data: existing } = await supabase
          .from('policy_embeddings')
          .select('id')
          .eq('notion_page_id', page.id)
          .single();

        // Create embedding for the content
        const embedding = await this.createEmbedding(page.content);

        const pageData = {
          notion_page_id: page.id,
          title: page.title,
          content: page.content,
          embedding: JSON.stringify(embedding),
          metadata: page.metadata,
          last_updated: page.lastEdited,
        };

        if (existing) {
          // Update existing page
          await supabase
            .from('policy_embeddings')
            .update(pageData)
            .eq('notion_page_id', page.id);
        } else {
          // Insert new page
          await supabase
            .from('policy_embeddings')
            .insert(pageData);
        }
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
      }
    }
  }
}
```

#### 2.2 RAG Service Implementation
**Objective**: Create service for semantic search and AI response generation

**File**: `src/services/ragService.ts`
```typescript
import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';

export interface SearchResult {
  id: string;
  notion_page_id: string;
  title: string;
  content: string;
  metadata: any;
  similarity: number;
}

export class RAGService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async searchRelevantContent(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // Create embedding for the query
      const queryEmbedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float',
      });

      // Search for similar content using our custom function
      const { data, error } = await supabase.rpc('similarity_search', {
        query_embedding: queryEmbedding.data[0].embedding,
        match_threshold: 0.1,
        match_count: limit,
      });

      if (error) {
        console.error('Similarity search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('RAG search error:', error);
      return [];
    }
  }

  async generateResponse(query: string, context: SearchResult[]): Promise<string> {
    if (context.length === 0) {
      return "I don't have enough information in the policy documents to answer this question accurately. Please consult with a compliance officer or refer to the policy documents directly.";
    }

    const contextText = context
      .map(item => `Policy: ${item.title}\nContent: ${item.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are a compliance AI assistant for an aged care organization. Your role is to provide accurate, helpful answers based on the organization's policy documents.

Guidelines:
- Always base your answers on the provided policy context
- If the context doesn't contain relevant information, clearly state this
- Be concise but comprehensive
- Reference specific policy sections when relevant
- Maintain a professional, helpful tone
- If something is unclear, suggest consulting the full policy document

Context from policy documents:
${contextText}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || 'I apologize, but I cannot provide an answer at this time.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      return 'I apologize, but I am experiencing technical difficulties. Please try again later.';
    }
  }

  async getPolicySummary(): Promise<{ totalPolicies: number; lastUpdated: string }> {
    const { data, error } = await supabase
      .from('policy_embeddings')
      .select('last_updated')
      .order('last_updated', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching policy summary:', error);
      return { totalPolicies: 0, lastUpdated: 'Unknown' };
    }

    return {
      totalPolicies: data.length,
      lastUpdated: data[0]?.last_updated || 'Never',
    };
  }
}
```

### Phase 3: Integration and Testing (2-3 days)

#### 3.1 Update Chat Interface
**Objective**: Integrate RAG services with existing chat component

**Modified File**: `src/components/ui/chat-interface.tsx`

Key changes:
- Import RAG service
- Replace mock responses with real RAG calls
- Add loading states for search/generation
- Handle errors gracefully
- Show context sources in responses

#### 3.2 Create Admin Interface
**Objective**: Build admin interface for managing RAG system

**New Components**:
- `PolicySyncManager`: Manual sync triggers
- `RAGSystemStatus`: Show sync status and statistics
- `PolicySearchTester`: Test search functionality

#### 3.3 Data Synchronization
**Objective**: Implement automatic sync mechanism

**Options**:
1. **Webhook-based**: Set up Notion webhooks for real-time updates
2. **Scheduled sync**: Cron job to periodically sync changes
3. **Manual sync**: Admin-triggered updates

### Phase 4: Testing and Deployment (2-3 days)

#### 4.1 Testing Strategy
**Test Cases**:
- Basic policy queries
- Complex multi-part questions
- Edge cases (no relevant content)
- Performance under load
- Error handling

#### 4.2 Performance Optimization
**Optimizations**:
- Chunking strategy for large documents
- Embedding caching
- Query result caching
- Index optimization

#### 4.3 Deployment Checklist
**Pre-deployment**:
- Environment variables configured
- Database migrations applied
- Initial data sync completed
- Error logging configured
- Monitoring alerts set up

### Phase 5: Monitoring and Maintenance

#### 5.1 Monitoring Setup
**Metrics to Track**:
- Query success rate
- Response time
- User satisfaction
- Data freshness
- API usage

#### 5.2 Maintenance Tasks
**Regular Tasks**:
- Monitor Notion API rate limits
- Update embeddings when policies change
- Review and improve response quality
- Update dependencies

## Technical Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Notion API    │───▶│  NotionExtractor │───▶│   Supabase      │
│   (Source)      │    │  (Process)       │    │   pgvector      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌──────────────────┐             │
│   Chat Interface│───▶│   RAG Service    │◀────────────┘
│   (Frontend)    │    │   (Search + AI)  │
└─────────────────┘    └──────────────────┘
```

## Risk Assessment and Mitigation

### High Risk Items
1. **API Rate Limits**: Notion API has strict rate limits
   - **Mitigation**: Implement exponential backoff, caching, batch processing

2. **Data Quality**: Poor embeddings lead to bad search results
   - **Mitigation**: Test embedding quality, implement relevance scoring

3. **Cost Management**: OpenAI API costs can escalate
   - **Mitigation**: Implement caching, rate limiting, cost monitoring

### Medium Risk Items
1. **Data Synchronization**: Keeping Notion and vector DB in sync
   - **Mitigation**: Webhook implementation, regular sync jobs

2. **Performance**: Slow response times
   - **Mitigation**: Optimize vector search, implement caching

## Success Criteria

### Functional Requirements
- [ ] Users can ask policy-related questions in natural language
- [ ] AI responses are based on actual policy content
- [ ] Responses include references to source policies
- [ ] System handles cases where no relevant information exists

### Non-Functional Requirements
- [ ] Response time < 3 seconds for typical queries
- [ ] System availability > 99%
- [ ] Data freshness < 1 hour lag from Notion updates
- [ ] Cost-effective operation within budget

## Timeline and Milestones

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Preparation | 1-2 days | Notion API access, dependencies installed |
| Core Services | 3-4 days | Data extraction and RAG services working |
| Integration | 2-3 days | Chat interface updated and functional |
| Testing | 2-3 days | System tested and optimized |
| Deployment | 1 day | Live in production |

## Budget Considerations

### Estimated Costs
- **OpenAI API**: ~$0.02 per 1K tokens (embeddings) + $0.03 per 1K tokens (chat)
- **Supabase**: Free tier sufficient for initial deployment
- **Notion API**: Free for basic usage

### Cost Optimization Strategies
- Implement response caching
- Use smaller embedding models where appropriate
- Batch embedding generation
- Monitor and optimize API usage

## Next Steps

1. **Immediate Actions** (Today):
   - Set up Notion integration
   - Configure environment variables
   - Install dependencies

2. **Week 1**:
   - Implement data extraction service
   - Set up vector database
   - Create basic RAG functionality

3. **Week 2**:
   - Integrate with chat interface
   - Implement synchronization
   - Testing and optimization

4. **Week 3**:
   - Deployment preparation
   - Monitoring setup
   - Go-live

This plan provides a comprehensive roadmap for implementing a production-ready RAG system. Each phase includes specific deliverables and success criteria to ensure systematic progress and quality outcomes.

