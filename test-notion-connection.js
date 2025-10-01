// Test script to verify Notion API connection
// Run with: node test-notion-connection.js

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: 'ntn_es8584362183suk08AQeH07vw8swb0ZXMjVr8oErNnB63W'
});

// Debug: Check what methods are available
console.log('Available methods on notion:', Object.getOwnPropertyNames(notion));
console.log('Available methods on notion.databases:', Object.getOwnPropertyNames(notion.databases));

async function testConnection() {
  try {
    console.log('🔍 Testing Notion API connection...');

    // Test basic API access
    const response = await notion.users.list();
    console.log('✅ Notion API connection successful!');
    console.log(`📊 Found ${response.results.length} users in workspace`);

    // Test database access
    const databaseId = '21c0332ab27a804d8a58f96e177bce74';

    console.log('🔍 Testing database access...');
    const dbResponse = await notion.databases.retrieve({ database_id: databaseId });
    console.log('✅ Database access successful!');
    console.log(`📋 Database title: ${dbResponse.title[0]?.plain_text || 'Untitled'}`);

    // Test alternative ways to query the database
    console.log('🔍 Testing database access methods...');

    // Try the search API as an alternative
    console.log('🔍 Testing search API...');
    try {
      const searchResponse = await notion.search({
        filter: {
          value: 'database',
          property: 'object'
        },
        query: 'Fairlea Policies'
      });
      console.log(`✅ Search API works! Found ${searchResponse.results.length} databases`);
    } catch (searchError) {
      console.error('❌ Search API failed:', searchError.message);
    }

    // Try to see if query method exists
    console.log('🔍 Checking if query method exists...');
    console.log('Has query method:', typeof notion.databases.query === 'function');

    // Try calling query anyway to see the actual error
    try {
      console.log('🔍 Attempting to call query method...');
      const queryResponse = await notion.databases.query({
        database_id: databaseId,
        page_size: 5
      });
      console.log(`✅ Database query successful!`);
      console.log(`📊 Found ${queryResponse.results.length} pages in database`);
    } catch (queryError) {
      console.error('❌ Database query failed:', queryError.message);
      console.log('This is likely a permissions or API version issue.');
      console.log('Make sure the integration has been granted access to the database.');
    }

  } catch (error) {
    console.error('❌ Notion API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your integration token is correct');
    console.log('2. Ensure the integration is added to your Notion workspace');
    console.log('3. Share your database with the integration');
    console.log('4. Check that your database ID is correct');
  }
}

testConnection();
