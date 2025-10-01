// RAG API - Server-side implementation for production
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';
import { corsHeaders } from '../_shared/cors.ts';

interface RAGRequest {
  action: 'sync' | 'query';
  query?: string;
  databaseId?: string;
}

interface RAGResponse {
  success: boolean;
  data?: any;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, query, databaseId }: RAGRequest = await req.json();

    // Initialize clients
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    if (action === 'sync' && databaseId) {
      // Sync Notion content
      const response = await syncNotionContent(databaseId, openai, supabase);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'query' && query) {
      // Handle user query
      const response = await handleQuery(query, openai, supabase);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action or missing parameters'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    console.error('RAG API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function syncNotionContent(databaseId: string, openai: OpenAI, supabase: any) {
  try {
    console.log('Starting Notion sync for database:', databaseId);

    // Get environment variables
    const notionToken = Deno.env.get('NOTION_API_KEY');
    if (!notionToken) {
      throw new Error('NOTION_API_KEY not configured');
    }

    // Extract pages from Notion
    const pages = await extractNotionPages(databaseId, notionToken);
    console.log(`Extracted ${pages.length} pages from Notion`);

    if (pages.length === 0) {
      return { success: false, error: 'No pages found in the Notion database' };
    }

    // Process and store pages with embeddings
    let processed = 0;
    let errors = 0;

    for (const page of pages) {
      try {
        // Create embedding
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: page.content,
          encoding_format: 'float',
        });

        // Store in database
        const { error } = await supabase
          .from('policy_embeddings')
          .upsert({
            notion_page_id: page.id,
            title: page.title,
            content: page.content,
            embedding: embedding.data[0].embedding,
            metadata: page.metadata,
            last_updated: page.lastEdited,
          });

        if (error) {
          console.error('Error storing page:', page.id, error);
          errors++;
        } else {
          processed++;
        }

      } catch (error) {
        console.error('Error processing page:', page.id, error);
        errors++;
      }
    }

    console.log(`Sync completed: ${processed} successful, ${errors} errors`);
    return {
      success: true,
      message: `Successfully synced ${processed} pages (${errors} errors)`
    };

  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
}

async function extractNotionPages(databaseId: string, notionToken: string) {
  const pages = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(startCursor && { start_cursor: startCursor }),
        page_size: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();

    for (const page of data.results) {
      if (page.properties) {
        const pageData = await extractPageData(page.id, notionToken);
        pages.push(pageData);
      }
    }

    hasMore = data.has_more;
    startCursor = data.next_cursor;

    // Rate limiting
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return pages;
}

async function extractPageData(pageId: string, notionToken: string) {
  // Get page title
  const title = 'Policy Document'; // Simplified for now

  // Get page content
  const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
    },
  });

  let content = '';
  if (blocksResponse.ok) {
    const blocksData = await blocksResponse.json();
    content = extractTextFromBlocks(blocksData.results);
  }

  return {
    id: pageId,
    title,
    content: content || 'No content available',
    metadata: {},
    lastEdited: new Date().toISOString(),
  };
}

function extractTextFromBlocks(blocks: any[]): string {
  let text = '';
  for (const block of blocks) {
    if (block.type === 'paragraph' && block.paragraph?.rich_text) {
      text += block.paragraph.rich_text.map((rt: any) => rt.plain_text || '').join('') + '\n';
    }
    // Add other block types as needed
  }
  return text.trim();
}

async function handleQuery(query: string, openai: OpenAI, supabase: any) {
  // Implementation would go here - search embeddings, generate response
  return { success: true, answer: 'Response generated', sources: [] };
}
