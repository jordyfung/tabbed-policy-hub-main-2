import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse request body
    const { firstName, lastName, email, role, invitationId, inviterName } = await req.json();
    
    if (!email || !role || !invitationId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      console.error('Failed to fetch invitation:', inviteError);
      return new Response(JSON.stringify({ error: 'Invalid invitation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate invitation URL
    const invitationUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/accept-invitation?token=${invitation.invitation_token}`;

    // Create personalized greeting
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : email;

    // Email HTML template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to the Team!</h2>
        <p>${greeting}</p>
        <p>${inviterName || 'Your administrator'} has invited you to join the team as a <strong>${role}</strong>.</p>
        <p>Click the button below to accept your invitation and get started:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p>This invitation will expire on ${new Date(invitation.invitation_expires_at).toLocaleDateString()}.</p>
        <p>If you have any questions, please contact your administrator.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
          <a href="${invitationUrl}">${invitationUrl}</a>
        </p>
      </div>
    `;

    console.log('Sending email to:', email);
    console.log('Using from address: onboarding@resend.dev (Resend test domain)');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Use Resend's test domain
        to: [email],
        subject: `You're invited to join the team as ${role}`,
        html: emailHtml
      })
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error('Failed to send email:', emailData);
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        details: emailData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Invitation email sent successfully to ${email}. Message ID: ${emailData.id}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation sent successfully',
      emailId: emailData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-invitation function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
