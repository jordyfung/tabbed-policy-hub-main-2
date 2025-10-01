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
  private notionToken: string;
  private openai: OpenAI;

  constructor() {
    const notionToken = import.meta.env.VITE_NOTION_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!notionToken) {
      throw new Error('VITE_NOTION_API_KEY environment variable is required. Please check your .env.local file.');
    }

    if (!openaiKey) {
      throw new Error('VITE_OPENAI_API_KEY environment variable is required. Please check your .env.local file.');
    }

    this.notionToken = notionToken;

    this.openai = new OpenAI({
      apiKey: openaiKey,
      dangerouslyAllowBrowser: true // ⚠️ SECURITY: Only for development/testing
    });
  }

  private async notionRequest(endpoint: string, options: RequestInit = {}) {
    const url = `https://api.notion.com/v1/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async extractAllPages(databaseId: string): Promise<NotionPage[]> {
    if (!databaseId) {
      throw new Error('Database ID is required');
    }

    const pages: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    console.log(`Starting extraction from Notion database: ${databaseId}`);

    while (hasMore) {
      try {
        const requestBody = {
          ...(startCursor && { start_cursor: startCursor }),
          page_size: 100, // Maximum allowed by Notion API
        };

        const response = await this.notionRequest(`databases/${databaseId}/query`, {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        console.log(`Fetched ${response.results.length} pages from Notion`);

        for (const page of response.results) {
          if ('properties' in page) {
            try {
              const pageData = await this.extractPageData(page);
              pages.push(pageData);
            } catch (error) {
              console.error(`Error extracting page ${page.id}:`, error);
              // Continue with other pages
            }
          }
        }

        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;

        // Add delay to respect rate limits
        if (hasMore) {
          await this.delay(1000); // 1 second delay between requests
        }

      } catch (error) {
        console.error('Error querying Notion database:', error);
        throw error;
      }
    }

    console.log(`Successfully extracted ${pages.length} pages from Notion`);
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
    // Try different title property names
    const titleProperty = page.properties.Name ||
                         page.properties.Title ||
                         page.properties.name ||
                         page.properties.title;

    if (titleProperty?.title?.[0]?.plain_text) {
      return titleProperty.title[0].plain_text;
    }

    // Fallback to page ID if no title found
    return `Untitled Page (${page.id.slice(-8)})`;
  }

  private async extractPageContent(pageId: string): Promise<string> {
    try {
      const blocks = await this.notionRequest(`blocks/${pageId}/children`);

      let content = '';

      for (const block of blocks.results) {
        const blockContent = this.processBlock(block);
        if (blockContent.trim()) {
          content += blockContent + '\n';
        }
      }

      return content.trim();
    } catch (error) {
      console.error(`Error extracting content for page ${pageId}:`, error);
      return '[Content extraction failed]';
    }
  }

  private processBlock(block: any): string {
    if (!('type' in block)) return '';

    try {
      switch (block.type) {
        case 'paragraph':
          return block.paragraph.rich_text.map((rt: any) => rt.plain_text || '').join('');

        case 'heading_1':
          return `# ${block.heading_1.rich_text.map((rt: any) => rt.plain_text || '').join('')}`;

        case 'heading_2':
          return `## ${block.heading_2.rich_text.map((rt: any) => rt.plain_text || '').join('')}`;

        case 'heading_3':
          return `### ${block.heading_3.rich_text.map((rt: any) => rt.plain_text || '').join('')}`;

        case 'bulleted_list_item':
          return `• ${block.bulleted_list_item.rich_text.map((rt: any) => rt.plain_text || '').join('')}`;

        case 'numbered_list_item':
          return `1. ${block.numbered_list_item.rich_text.map((rt: any) => rt.plain_text || '').join('')}`;

        case 'to_do':
          const checked = block.to_do.checked ? '[x]' : '[ ]';
          const text = block.to_do.rich_text.map((rt: any) => rt.plain_text || '').join('');
          return `${checked} ${text}`;

        case 'code':
          const code = block.code.rich_text.map((rt: any) => rt.plain_text || '').join('');
          const language = block.code.language || '';
          return `\`\`\`${language}\n${code}\n\`\`\``;

        case 'quote':
          const quote = block.quote.rich_text.map((rt: any) => rt.plain_text || '').join('');
          return `> ${quote}`;

        case 'divider':
          return '---';

        case 'table':
          // Tables are complex, just return a placeholder for now
          return '[Table content]';

        case 'image':
          return '[Image]';

        case 'file':
          return '[File attachment]';

        case 'bookmark':
          return block.bookmark.url || '[Bookmark]';

        case 'link_preview':
          return block.link_preview.url || '[Link]';

        default:
          // For unsupported block types, try to extract any rich text
          const richText = block[block.type]?.rich_text;
          if (richText && Array.isArray(richText)) {
            return richText.map((rt: any) => rt.plain_text || '').join('');
          }
          return '';
      }
    } catch (error) {
      console.warn(`Error processing block of type ${block.type}:`, error);
      return '';
    }
  }

  private extractMetadata(page: any): any {
    return {
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      properties: page.properties,
      archived: page.archived,
      in_trash: page.in_trash,
    };
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot create embedding for empty text');
    }

    // Limit text length to avoid token limits (8191 tokens for text-embedding-3-small)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncatedText,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async processAndStorePages(pages: NotionPage[]): Promise<void> {
    console.log(`Processing and storing ${pages.length} pages...`);

    let processed = 0;
    let errors = 0;

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
          const { error: updateError } = await supabase
            .from('policy_embeddings')
            .update(pageData)
            .eq('notion_page_id', page.id);

          if (updateError) {
            console.error(`Error updating page ${page.id}:`, updateError);
            errors++;
          } else {
            console.log(`Updated page: ${page.title}`);
          }
        } else {
          // Insert new page
          const { error: insertError } = await supabase
            .from('policy_embeddings')
            .insert(pageData);

          if (insertError) {
            console.error(`Error inserting page ${page.id}:`, insertError);
            errors++;
          } else {
            console.log(`Inserted new page: ${page.title}`);
          }
        }

        processed++;

        // Log progress every 10 pages
        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${pages.length} pages (${errors} errors)`);
        }

        // Add delay between API calls to avoid rate limits
        await this.delay(500);

      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
        errors++;
      }
    }

    console.log(`Completed processing: ${processed} successful, ${errors} errors`);

    // Log completion in system status
    await this.logSystemStatus('sync', processed > errors ? 'success' : 'error',
      `Processed ${processed} pages with ${errors} errors`);
  }

  private async logSystemStatus(operationType: string, status: string, message: string, metadata?: any) {
    try {
      await supabase
        .from('rag_system_status')
        .insert({
          operation_type: operationType,
          status,
          message,
          metadata,
        });
    } catch (error) {
      console.error('Error logging system status:', error);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getSyncStatus(): Promise<{ totalPolicies: number; lastSync: string | null }> {
    try {
      const { data, error } = await supabase
        .from('policy_embeddings')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching sync status:', error);
        return { totalPolicies: 0, lastSync: null };
      }

      const { data: countData, error: countError } = await supabase
        .from('policy_embeddings')
        .select('id', { count: 'exact', head: true });

      return {
        totalPolicies: countData || 0,
        lastSync: data?.[0]?.created_at || null,
      };
    } catch (error) {
      console.error('Error in getSyncStatus:', error);
      return { totalPolicies: 0, lastSync: null };
    }
  }
}
