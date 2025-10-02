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

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  confidence: 'high' | 'medium' | 'low';
  processingTime: number;
}

export class RAGServiceImproved {
  private openai: OpenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY environment variable is required. Please check your .env file.');
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // ⚠️ SECURITY: Only for development/testing
    });
  }

  async searchRelevantContent(query: string, limit: number = 5): Promise<SearchResult[]> {
    const startTime = Date.now();

    try {
      console.log(`Searching for relevant content: "${query}"`);

      // Create embedding for the query
      const queryEmbedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float',
      });

      console.log(`Created embedding, searching database with pgvector...`);

      // Use Supabase RPC function for vector similarity search
      const { data, error } = await supabase.rpc('similarity_search', {
        query_embedding: queryEmbedding.data[0].embedding,
        match_threshold: 0.1,
        match_count: limit
      });

      if (error) {
        console.error('Vector search error:', error);
        await this.logSystemStatus('search', 'error', `Vector search failed: ${error.message}`, { query });
        return [];
      }

      if (!data || data.length === 0) {
        console.log('No similar content found');
        await this.logSystemStatus('search', 'success', 'No similar content found', { query, resultsCount: 0 });
        return [];
      }

      const processingTime = Date.now() - startTime;
      console.log(`Found ${data.length} relevant results in ${processingTime}ms using pgvector`);

      await this.logSystemStatus('search', 'success', `Found ${data.length} results`, {
        query,
        resultsCount: data.length,
        processingTime
      });

      return data;
    } catch (error) {
      console.error('RAG search error:', error);
      await this.logSystemStatus('search', 'error', `Search failed: ${error}`, { query });
      return [];
    }
  }

  async generateResponse(query: string, context: SearchResult[]): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      console.log(`Generating response for query: "${query}" with ${context.length} context items`);

      if (context.length === 0) {
        const response: RAGResponse = {
          answer: "I don't have enough information in the policy documents to answer this question accurately. Please consult with a compliance officer or refer to the policy documents directly.",
          sources: [],
          confidence: 'low',
          processingTime: Date.now() - startTime,
        };

        await this.logSystemStatus('generation', 'success', 'No context available', {
          query,
          responseLength: response.answer.length,
          processingTime: response.processingTime
        });

        return response;
      }

      // Prepare context for the AI
      const contextText = context
        .map(item => `Policy: ${item.title}\nContent: ${item.content}`)
        .join('\n\n---\n\n');

      // Calculate average similarity for confidence scoring
      const avgSimilarity = context.reduce((sum, item) => sum + item.similarity, 0) / context.length;
      const confidence: 'high' | 'medium' | 'low' =
        avgSimilarity > 0.8 ? 'high' :
        avgSimilarity > 0.6 ? 'medium' : 'low';

      const systemPrompt = `You are a compliance AI assistant for an aged care organization. Your role is to provide accurate, helpful answers based on the organization's policy documents.

Guidelines:
- Always base your answers on the provided policy context
- If the context doesn't contain relevant information, clearly state this and suggest consulting the full policy document
- Be concise but comprehensive
- Use professional, helpful tone
- If asked about specific procedures, provide step-by-step guidance when available
- Always cite which policy document your information comes from`;

      const userPrompt = `Based on the following policy documents, please answer this question: "${query}"

Policy Documents:
${contextText}

Please provide a helpful, accurate response based on the policy information above.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const answer = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      const response: RAGResponse = {
        answer,
        sources: context,
        confidence,
        processingTime: Date.now() - startTime,
      };

      await this.logSystemStatus('generation', 'success', `Generated response`, {
        query,
        responseLength: answer.length,
        processingTime: response.processingTime,
        confidence
      });

      return response;
    } catch (error) {
      console.error('Response generation error:', error);
      await this.logSystemStatus('generation', 'error', `Generation failed: ${error}`, { query });

      return {
        answer: "I'm sorry, I encountered an error while processing your request. Please try again.",
        sources: [],
        confidence: 'low',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async getResponseWithContext(query: string): Promise<RAGResponse> {
    try {
      console.log(`Getting response with context for: "${query}"`);
      
      // Search for relevant content
      const relevantContent = await this.searchRelevantContent(query);
      
      // Generate response with context
      const response = await this.generateResponse(query, relevantContent);
      
      return response;
    } catch (error) {
      console.error('Error getting response with context:', error);
      return {
        answer: "I'm sorry, I encountered an error while processing your request. Please try again.",
        sources: [],
        confidence: 'low',
        processingTime: 0,
      };
    }
  }

  async isSystemReady(): Promise<boolean> {
    try {
      // Check if we have any embeddings in the database
      const { data, error } = await supabase
        .from('policy_embeddings')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database check error:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('System readiness check error:', error);
      return false;
    }
  }

  async getSystemStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('rag_system_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Stats query error:', error);
        return {
          totalPolicies: 0,
          successfulSyncs: 0,
          totalErrors: 0,
          lastPolicyUpdate: null,
          lastSyncAttempt: null
        };
      }

      return data;
    } catch (error) {
      console.error('Stats retrieval error:', error);
      return {
        totalPolicies: 0,
        successfulSyncs: 0,
        totalErrors: 0,
        lastPolicyUpdate: null,
        lastSyncAttempt: null
      };
    }
  }

  private async logSystemStatus(operation: string, status: string, message: string, metadata: any = {}) {
    try {
      await supabase
        .from('rag_system_status')
        .insert({
          operation_type: operation,
          status,
          message,
          metadata
        });
    } catch (error) {
      console.error('Error logging system status:', error);
    }
  }
}
