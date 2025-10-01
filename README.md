# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f5be4c1a-bbc0-4987-89e1-03593a8c7995

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f5be4c1a-bbc0-4987-89e1-03593a8c7995) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Auth)
- Notion API (Content Source)
- OpenAI API (AI Responses)

## RAG (Retrieval-Augmented Generation) System

This application includes an AI-powered compliance assistant that uses Retrieval-Augmented Generation to provide accurate answers based on your organization's policy documents stored in Notion.

### Features

- **Intelligent Q&A**: Ask questions about policies and get contextually relevant answers
- **Source Citations**: Every AI response includes references to the original policy documents
- **Real-time Sync**: Automatically sync policy updates from Notion
- **Admin Management**: Easy-to-use interface for managing the knowledge base
- **Performance Monitoring**: Track system usage and response quality

### Setup Instructions

1. **Environment Variables**:
   ```bash
   # Copy the environment template
   cp env-example.txt .env.local

   # Edit .env.local with your actual values
   ```

2. **Notion Integration**:
   - Create a Notion integration at [developers.notion.com](https://developers.notion.com/)
   - Share your policy database with the integration
   - Copy the integration token and database ID to your environment variables

3. **Database Setup**:
   ```bash
   # The RAG system migration should run automatically
   # If needed, you can run migrations manually:
   npx supabase db push
   ```

4. **Initial Sync**:
   - Go to Dashboard → RAG Management → Data Sync
   - Click "Sync Now" to import your Notion policies
   - Test the system using the "System Test" tab

### Usage

- **For Users**: Use the "AI Assistant" tab in the Policies section to ask questions
- **For Admins**: Use Dashboard → RAG Management to sync data and monitor performance
- **For Testing**: Use the system tester to validate responses and fine-tune the AI

### Architecture

```
Notion Database → NotionExtractor → Supabase (pgvector) → RAG Service → Chat Interface
```

The system uses OpenAI's embeddings to create vector representations of policy content, enabling semantic search and contextually relevant AI responses.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f5be4c1a-bbc0-4987-89e1-03593a8c7995) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
