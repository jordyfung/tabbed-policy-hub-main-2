import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get assignments that are due soon (within 7 days) or overdue
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const now = new Date().toISOString();

    // Query assignments that are due soon or overdue
    const { data: upcomingAssignments, error: upcomingError } = await supabase
      .from('course_assignments')
      .select(`
        *,
        profiles!course_assignments_assigned_to_fkey(email, first_name, last_name),
        courses(title, course_frequencies(email_notifications_enabled))
      `)
      .lte('due_date', sevenDaysFromNow.toISOString())
      .is('completed_at', null);

    if (upcomingError) throw upcomingError;

    let upcomingCount = 0;
    let overdueCount = 0;

    // Process each assignment
    for (const assignment of upcomingAssignments || []) {
      if (assignment.profiles?.email) {
        // Check if email notifications are enabled for this course
        const frequencySettings = assignment.courses?.course_frequencies;
        const notificationsEnabled = frequencySettings?.some((freq: any) => 
          freq.email_notifications_enabled !== false
        );

        if (notificationsEnabled !== false) {
          const isOverdue = new Date(assignment.due_date) < new Date();
          
          // Send reminder email
          const { error: emailError } = await supabase.functions.invoke('send-training-reminder', {
            body: {
              email: assignment.profiles.email,
              courseTitle: assignment.courses?.title || 'Unknown Course',
              dueDate: assignment.due_date,
              isOverdue: isOverdue,
              reminderType: isOverdue ? 'overdue' : 'upcoming'
            }
          });

          if (!emailError) {
            if (isOverdue) {
              overdueCount++;
            } else {
              upcomingCount++;
            }

            // Log the notification
            await supabase
              .from('training_notifications')
              .insert({
                user_id: assignment.assigned_to,
                assignment_id: assignment.id,
                notification_type: isOverdue ? 'overdue' : 'upcoming',
                sent_at: new Date().toISOString()
              });
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Automated reminders processed',
      upcoming: upcomingCount,
      overdue: overdueCount,
      total: upcomingCount + overdueCount
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error processing automated reminders:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
