import OpenAI from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatSession {
  messages: ChatMessage[];
  isActive: boolean;
}

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are a friendly and empathetic AI assistant helping employees share their work preferences and personality traits. Your goal is to understand how the company can best cater to their needs without offering the world.

Guidelines:
- Be conversational, warm, and encouraging
- Ask open-ended questions about work preferences, communication styles, learning preferences, and work environment preferences
- Focus on understanding their personality, work style, and what motivates them
- Keep responses concise but engaging
- Show genuine interest in their responses
- Ask follow-up questions to dig deeper into interesting responses
- Avoid being too formal or corporate - be human-like
- Don't ask too many questions at once - keep it conversational

Start by introducing yourself and explaining that you're here to help the company understand their work preferences better.`;

// Initial conversation starters
export const CONVERSATION_STARTERS = [
  "Hi! I'm here to help your company understand your work preferences better. What aspects of your work do you find most fulfilling?",
  "Hello! I'd love to learn about your work style. What kind of work environment helps you do your best?",
  "Hi there! I'm curious about what motivates you at work. What gets you excited about coming to work each day?",
  "Hello! I'm here to understand your preferences so the company can better support you. What's your ideal way of receiving feedback or recognition?"
];

export class AIService {
  private static instance: AIService;
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Lazy initialization - only create OpenAI client when API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      try {
        this.openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
        });
        this.isConfigured = true;
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('OpenAI API key not configured. AI features will be disabled.');
      this.isConfigured = false;
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Get AI response for a chat message
   */
  async getChatResponse(messages: ChatMessage[]): Promise<string> {
    if (!this.isConfigured || !this.openai) {
      return 'AI features are currently disabled. Please contact your administrator to enable OpenAI integration.';
    }

    try {
      // Add system prompt if this is the first message
      const chatMessages = messages.length === 1 && messages[0].role === 'user' 
        ? [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages]
        : messages;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: chatMessages,
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I had trouble processing that. Could you try again?';
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
    }
  }

  /**
   * Summarize the conversation into a work profile, merging with existing summary if available
   */
  async summarizeConversation(messages: ChatMessage[], existingSummary?: string): Promise<string> {
    if (!this.isConfigured || !this.openai) {
      return 'Unable to generate summary. AI features are currently disabled.';
    }

    try {
      const conversationText = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      let summaryPrompt: string;

      if (existingSummary) {
        // Merge mode: Update existing summary with new information
        summaryPrompt = `You are updating an employee's work profile with new insights from a recent conversation.

EXISTING WORK PROFILE:
${existingSummary}

NEW CONVERSATION:
${conversationText}

TASK: Intelligently merge the new conversation with the existing profile. 

CRITICAL RULES FOR MERGING:
1. PRESERVE ALL CORE SECTIONS from the existing profile - do NOT omit them
2. If a core section exists in the EXISTING profile but isn't mentioned in the NEW conversation, KEEP it unchanged
3. ONLY update sections with relevant new information from the conversation
4. DO NOT force unrelated topics into multiple sections
5. New contradictory info takes precedence over old info in that specific section

CORE SECTIONS (ALWAYS include if they exist in the profile):
**Work Style** - collaborative vs independent, structured vs flexible work preferences
**Communication** - communication style and preferences at work
**Learning & Development** - professional growth, training, skill development
**Motivation** - what drives performance and engagement at work
**Environment** - ideal workplace conditions and needs

OPTIONAL SECTION:
**Personal Interests** - hobbies, activities, and interests outside work (only include if mentioned in existing or new conversation)

OUTPUT REQUIREMENTS:
- Write in FIRST PERSON using "I" statements
- Use bullet points for clarity
- MUST include all core sections that exist in the EXISTING profile
- Update only sections where new relevant info is provided
- Add Personal Interests section if the new conversation mentions hobbies/non-work topics
- Be concise and natural - avoid repetition
- Keep the warm, authentic voice

EXAMPLE:
- If existing profile has Work Style, Communication, Environment sections
- New conversation only mentions "I like basketball"
- OUTPUT: Keep Work Style, Communication, Environment unchanged + add Personal Interests section for basketball

Create a complete, merged profile that preserves existing work sections while incorporating new insights.`;
      } else {
        // First-time mode: Create new summary from scratch
        summaryPrompt = `Please analyze the following conversation and create a concise, professional work profile summary written in FIRST PERSON from the employee's perspective. Use "I" statements throughout.

AVAILABLE SECTIONS (use Markdown formatting):

**Work Style** - collaborative vs independent, structured vs flexible work preferences
**Communication** - communication style and preferences at work
**Learning & Development** - professional growth, training, skill development
**Motivation** - what drives performance and engagement at work
**Environment** - ideal workplace conditions and needs
**Personal Interests** - hobbies, activities, and interests outside work

CRITICAL RULES:
- ONLY include sections and information that are mentioned or clearly implied in the conversation
- DO NOT fabricate or assume information not discussed
- DO NOT force topics into sections where they don't naturally fit
- Be concise and natural - avoid repetition
- Include at least one work-related section if any work preferences are mentioned
- Include Personal Interests ONLY if hobbies/non-work activities are mentioned

GUIDELINES:
- Write in a warm, authentic first-person voice
- Use bullet points for clarity
- Keep it professional but personal
- It's acceptable to have a minimal profile if the conversation was brief or off-topic

Conversation:
${conversationText}

Create a focused, natural Markdown summary based ONLY on what was actually discussed.`;
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert HR analyst who creates and updates personalized employee work profiles written in first person. Use Markdown formatting with bold headings and bullet points. CRITICAL RULES: 1) Only include information relevant to each section - never force unrelated topics into multiple sections. 2) When MERGING, PRESERVE ALL existing core work sections even if not mentioned in the new conversation - only update sections with new relevant info. 3) When creating NEW profiles, only include sections with actual data from the conversation.' },
          { role: 'user', content: summaryPrompt }
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate summary at this time.';
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return 'Unable to generate summary at this time. Please try again later.';
    }
  }

  /**
   * Get a random conversation starter
   */
  getRandomStarter(): string {
    const randomIndex = Math.floor(Math.random() * CONVERSATION_STARTERS.length);
    return CONVERSATION_STARTERS[randomIndex];
  }

  /**
   * Check if the conversation has enough content to summarize
   */
  shouldSummarize(messages: ChatMessage[]): boolean {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const totalContent = userMessages.reduce((acc, msg) => acc + msg.content.length, 0);
    
    // Require at least 3 user messages and 200 characters of content
    return userMessages.length >= 3 && totalContent >= 200;
  }
}

export default AIService;
