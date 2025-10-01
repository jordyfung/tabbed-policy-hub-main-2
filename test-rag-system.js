// Test the RAG system end-to-end
// Run with: node test-rag-system.js

import { NotionExtractor } from './src/services/notionExtractor.js';
import { RAGService } from './src/services/ragService.js';

async function testRAGSystem() {
  console.log('🚀 Testing RAG System...\n');

  try {
    // Test 1: Notion Extractor
    console.log('1️⃣ Testing Notion Extractor...');
    const extractor = new NotionExtractor();

    const pages = await extractor.extractAllPages('21c0332ab27a804d8a58f96e177bce74');
    console.log(`✅ Extracted ${pages.length} pages from Notion`);

    if (pages.length > 0) {
      console.log(`📄 Sample page: "${pages[0].title}"`);
      console.log(`📝 Content preview: ${pages[0].content.substring(0, 100)}...`);
    }

    // Test 2: Data Storage
    console.log('\n2️⃣ Testing Data Storage...');
    await extractor.processAndStorePages(pages.slice(0, 2)); // Test with first 2 pages
    console.log('✅ Pages processed and stored');

    // Test 3: RAG Service
    console.log('\n3️⃣ Testing RAG Service...');
    const ragService = new RAGService();

    // Test search
    const searchResults = await ragService.searchRelevantContent('policy compliance');
    console.log(`✅ Search returned ${searchResults.length} results`);

    if (searchResults.length > 0) {
      // Test response generation
      const response = await ragService.generateResponse('What are the main compliance requirements?', searchResults);
      console.log('✅ AI Response generated');
      console.log(`📊 Confidence: ${response.confidence}`);
      console.log(`⏱️ Processing time: ${response.processingTime}ms`);
      console.log(`💬 Response: ${response.answer.substring(0, 150)}...`);
    }

    // Test 4: System Stats
    console.log('\n4️⃣ Testing System Stats...');
    const stats = await ragService.getSystemStats();
    console.log(`📊 Total policies: ${stats.totalPolicies}`);
    console.log(`📅 Last sync: ${stats.lastSync || 'Never'}`);
    console.log(`🔍 Recent searches: ${stats.recentSearches}`);
    console.log(`❌ Recent errors: ${stats.recentErrors}`);

    console.log('\n🎉 All RAG system tests passed!');

  } catch (error) {
    console.error('❌ RAG System test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your environment variables');
    console.log('2. Verify Notion database permissions');
    console.log('3. Check OpenAI API key');
    console.log('4. Ensure Supabase is running');
  }
}

testRAGSystem();

