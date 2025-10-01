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

export class RAGService {
  private openai: OpenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY environment variable is required. Please check your .env.local file.');
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

      console.log(`Created embedding, searching database...`);

      // Get all embeddings from database (simplified approach without vector extension)
      const { data: allEmbeddings, error } = await supabase
        .from('policy_embeddings')
        .select('id, notion_page_id, title, content, metadata, embedding');

      if (error) {
        console.error('Database query error:', error);
        await this.logSystemStatus('search', 'error', `Database query failed: ${error.message}`, { query });
        return [];
      }

      if (!allEmbeddings || allEmbeddings.length === 0) {
        console.log('No embeddings found in database');
        await this.logSystemStatus('search', 'success', 'No embeddings found', { query, resultsCount: 0 });
        return [];
      }

      // Calculate cosine similarity for each embedding (simplified approach)
      const queryVector = queryEmbedding.data[0].embedding;
      const similarities = allEmbeddings.map(item => {
        if (!item.embedding) return { ...item, similarity: 0 };

        try {
          // Convert JSONB embedding back to array
          const docVector = Array.isArray(item.embedding) ? item.embedding : item.embedding;

          // Calculate cosine similarity
          const similarity = this.cosineSimilarity(queryVector, docVector);
          return { ...item, similarity };
        } catch (error) {
          console.warn('Error calculating similarity for item:', item.id, error);
          return { ...item, similarity: 0 };
        }
      });

      // Sort by similarity and take top results
      const sortedResults = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .filter(item => item.similarity > 0.1); // Filter out very dissimilar results

      const data = sortedResults;

      const processingTime = Date.now() - startTime;
      console.log(`Found ${data?.length || 0} relevant results in ${processingTime}ms`);

      await this.logSystemStatus('search', 'success', `Found ${data?.length || 0} results`, {
        query,
        resultsCount: data?.length || 0,
        processingTime
      });

      return data || [];
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
- Be concise but comprehensive in your answers
- Reference specific policy sections or titles when relevant
- Maintain a professional, helpful tone appropriate for healthcare compliance
- Include specific details from the policies when available
- If there are conflicting or unclear policies, note this and recommend verification

Context from policy documents:
${contextText}

Important: Only use information from the provided context. Do not make up or assume information not present in the context.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.1, // Low temperature for consistent, factual responses
        max_tokens: 1000,
        presence_penalty: 0,
        frequency_penalty: 0,
      });

      const answer = response.choices[0].message.content || 'I apologize, but I cannot provide an answer at this time.';

      const ragResponse: RAGResponse = {
        answer,
        sources: context,
        confidence,
        processingTime: Date.now() - startTime,
      };

      console.log(`Generated response in ${ragResponse.processingTime}ms with ${confidence} confidence`);

      await this.logSystemStatus('generation', 'success', `Generated response with ${confidence} confidence`, {
        query,
        contextCount: context.length,
        responseLength: answer.length,
        confidence,
        processingTime: ragResponse.processingTime
      });

      return ragResponse;

    } catch (error) {
      console.error('RAG generation error:', error);

      await this.logSystemStatus('generation', 'error', `Generation failed: ${error}`, {
        query,
        contextCount: context.length
      });

      // Return a safe fallback response
      return {
        answer: 'I apologize, but I am experiencing technical difficulties. Please try again later or consult the policy documents directly.',
        sources: context,
        confidence: 'low',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async askQuestion(query: string): Promise<RAGResponse> {
    console.log(`Processing question: "${query}"`);

    // Search for relevant content
    const relevantContent = await this.searchRelevantContent(query);

    // Generate response using the context
    const response = await this.generateResponse(query, relevantContent);

    return response;
  }

  async getSystemStats(): Promise<{
    totalPolicies: number;
    lastSync: string | null;
    recentSearches: number;
    recentErrors: number;
  }> {
    try {
      // Get policy count
      const { count: totalPolicies } = await supabase
        .from('policy_embeddings')
        .select('*', { count: 'exact', head: true });

      // Get last sync time
      const { data: lastSyncData } = await supabase
        .from('policy_embeddings')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: recentSearches } = await supabase
        .from('rag_system_status')
        .select('*', { count: 'exact', head: true })
        .eq('operation_type', 'search')
        .gte('created_at', yesterday.toISOString());

      const { count: recentErrors } = await supabase
        .from('rag_system_status')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')
        .gte('created_at', yesterday.toISOString());

      return {
        totalPolicies: totalPolicies || 0,
        lastSync: lastSyncData?.created_at || null,
        recentSearches: recentSearches || 0,
        recentErrors: recentErrors || 0,
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalPolicies: 0,
        lastSync: null,
        recentSearches: 0,
        recentErrors: 0,
      };
    }
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('rag_system_status')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error clearing old logs:', error);
      } else {
        console.log(`Cleared logs older than ${daysToKeep} days`);
      }
    } catch (error) {
      console.error('Error in clearOldLogs:', error);
    }
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

  // Utility method to check if the system is ready
  async isSystemReady(): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('policy_embeddings')
        .select('id')
        .limit(1);

      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error checking system readiness:', error);
      return false;
    }
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      console.warn('Vector length mismatch:', vecA.length, 'vs', vecB.length);
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}
