import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrainingReminderRequest {
  email: string;
  courseTitle: string;
  dueDate: string;
  isOverdue: boolean;
  reminderType: 'upcoming' | 'overdue' | 'frequency';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse request body
    const { email, courseTitle, dueDate, isOverdue, reminderType }: TrainingReminderRequest = await req.json()

    if (!email || !courseTitle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate email content based on reminder type
    let subject: string;
    let emailHtml: string;

    if (isOverdue) {
      subject = `URGENT: Overdue Training - ${courseTitle}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ Training Overdue</h2>
          <p>Hi there,</p>
          <p><strong>Your training for "${courseTitle}" is now overdue.</strong></p>
          <p>Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
          <p>Please complete this training as soon as possible to maintain compliance.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #dc2626;"><strong>Action Required:</strong> Complete your training immediately.</p>
          </div>
          <p>If you have any questions, please contact your administrator.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated reminder from your training management system.
          </p>
        </div>
      `;
    } else if (reminderType === 'upcoming') {
      subject = `Training Reminder - ${courseTitle}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📚 Training Reminder</h2>
          <p>Hi there,</p>
          <p>This is a friendly reminder that your training for <strong>"${courseTitle}"</strong> is due soon.</p>
          <p>Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
          <p>Please complete this training before the due date to maintain compliance.</p>
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2563eb;"><strong>Next Steps:</strong> Log in to your training portal and complete the course.</p>
          </div>
          <p>If you have any questions, please contact your administrator.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated reminder from your training management system.
          </p>
        </div>
      `;
    } else {
      // Frequency-based reminder
      subject = `Training Due - ${courseTitle}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">🔄 Training Due</h2>
          <p>Hi there,</p>
          <p>It's time to complete your recurring training for <strong>"${courseTitle}"</strong>.</p>
          <p>Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
          <p>This training is required to maintain your certification and compliance.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #059669;"><strong>Action Required:</strong> Complete your training by the due date.</p>
          </div>
          <p>If you have any questions, please contact your administrator.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated reminder from your training management system.
          </p>
        </div>
      `;
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Training System <noreply@yourdomain.com>', // Replace with your verified domain
        to: [email],
        subject: subject,
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailData = await emailResponse.json()

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailData.id,
      message: 'Training reminder sent successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error sending training reminder:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
