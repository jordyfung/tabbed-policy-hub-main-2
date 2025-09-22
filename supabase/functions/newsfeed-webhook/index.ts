import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

interface WebhookPayload {
  title?: string;
  content: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  scheduled_for?: string;
  author_name?: string;
}

interface PostInsert {
  title?: string;
  content: string;
  category?: string;
  priority?: string;
  author_id: string;
  author_name: string;
  author_role: string;
  author_type: string;
  created_at?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('NEWSFEED_WEBHOOK_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate webhook secret if provided
    const providedSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret && providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate payload
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', payload);

    if (!payload.content?.trim()) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a system user ID for webhook posts (using a consistent UUID)
    const systemUserId = '00000000-0000-0000-0000-000000000001';

    // Prepare post data
    const postData: PostInsert = {
      title: payload.title || null,
      content: payload.content.trim(),
      category: payload.category || 'Industry Update',
      priority: payload.priority || 'medium',
      author_id: systemUserId,
      author_name: payload.author_name || 'AgedCare Insights',
      author_role: 'Industry Research Bot',
      author_type: 'system',
    };

    // Handle scheduled posting
    if (payload.scheduled_for) {
      try {
        const scheduledDate = new Date(payload.scheduled_for);
        if (scheduledDate > new Date()) {
          postData.created_at = scheduledDate.toISOString();
        }
      } catch (error) {
        console.warn('Invalid scheduled_for date, posting immediately:', error);
      }
    }

    // Auto-categorize based on content keywords
    const content = payload.content.toLowerCase();
    if (!payload.category) {
      if (content.includes('regulation') || content.includes('compliance') || content.includes('acfi')) {
        postData.category = 'Regulatory Update';
        postData.priority = 'high';
      } else if (content.includes('best practice') || content.includes('quality') || content.includes('care standard')) {
        postData.category = 'Best Practice';
      } else if (content.includes('funding') || content.includes('financial') || content.includes('budget')) {
        postData.category = 'Financial Update';
        postData.priority = 'high';
      } else if (content.includes('training') || content.includes('education') || content.includes('skill')) {
        postData.category = 'Training & Development';
      }
    }

    // Auto-adjust priority based on content
    if (!payload.priority) {
      if (content.includes('urgent') || content.includes('immediate') || content.includes('critical')) {
        postData.priority = 'high';
      } else if (content.includes('update') || content.includes('change') || content.includes('new')) {
        postData.priority = 'medium';
      }
    }

    console.log('Inserting post data:', postData);

    // Insert the post into the database
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to create post', 
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully created post:', data);

    // Log webhook activity for debugging
    console.log(`Webhook processed successfully:
      - Post ID: ${data.id}
      - Title: ${data.title || 'No title'}
      - Category: ${data.category}
      - Priority: ${data.priority}
      - Author: ${data.author_name}
      - Content length: ${data.content.length} characters`);

    return new Response(JSON.stringify({ 
      success: true, 
      post: {
        id: data.id,
        title: data.title,
        category: data.category,
        priority: data.priority,
        created_at: data.created_at
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});