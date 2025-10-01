// Quick script to help get your Notion database ID
// Run this in your browser console when viewing your Notion database

console.log(`
📋 To get your Notion Database ID:

1. Open your Notion database in your browser
2. Look at the URL - it should look like:
   https://www.notion.so/workspace/database-name-1234567890abcdef1234567890abcdef

3. The database ID is the long string at the end:
   Example: 21c0332ab27a804d8a58f96e177bce74

4. Copy this ID and add it to your environment variables as NOTION_DATABASE_ID

Your current URL: ${window.location.href}

If you can see a database ID in the URL above, copy it!
Otherwise, ask your Notion workspace admin to share the database with your integration.
`);

