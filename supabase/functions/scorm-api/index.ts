import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SCORM 1.2 Data Model Elements
interface SCORMData {
  // Core elements
  'cmi.core.student_id'?: string;
  'cmi.core.student_name'?: string;
  'cmi.core.lesson_location'?: string;
  'cmi.core.credit'?: string;
  'cmi.core.lesson_status'?: string;
  'cmi.core.entry'?: string;
  'cmi.core.score.raw'?: string;
  'cmi.core.score.max'?: string;
  'cmi.core.score.min'?: string;
  'cmi.core.total_time'?: string;
  'cmi.core.lesson_mode'?: string;
  'cmi.core.exit'?: string;
  'cmi.core.session_time'?: string;
  
  // Suspend data
  'cmi.suspend_data'?: string;
  
  // Launch data
  'cmi.launch_data'?: string;
  
  // Comments
  'cmi.comments'?: string;
  'cmi.comments_from_lms'?: string;
  
  // Interactions (array)
  'cmi.interactions'?: Array<{
    id: string;
    objectives: string[];
    time: string;
    type: string;
    correct_responses: string[];
    weighting: string;
    student_response: string;
    result: string;
    latency: string;
  }>;
  
  // Objectives (array)
  'cmi.objectives'?: Array<{
    id: string;
    score: {
      raw: string;
      max: string;
      min: string;
    };
    status: string;
  }>;
  
  // Student preferences
  'cmi.student_preference.audio'?: string;
  'cmi.student_preference.language'?: string;
  'cmi.student_preference.speed'?: string;
  'cmi.student_preference.text'?: string;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  // This is how to handle a CORS preflight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { scormCourseId, cmiData } = await req.json();

    // Create a Supabase client with the Auth context of the user that called the function.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Now we can get the session or user object
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map the incoming cmiData to the scorm_tracking table columns
    const trackingData = {
      user_id: user.id,
      scorm_course_id: scormCourseId,
      student_id: user.id, // Or cmiData['cmi.core.student_id'] if available
      student_name: user.email, // Or cmiData['cmi.core.student_name']
      lesson_location: cmiData['cmi.core.lesson_location'],
      lesson_status: cmiData['cmi.core.lesson_status'],
      score_raw: cmiData['cmi.core.score.raw'] ? parseFloat(cmiData['cmi.core.score.raw']) : null,
      score_max: cmiData['cmi.core.score.max'] ? parseFloat(cmiData['cmi.core.score.max']) : null,
      score_min: cmiData['cmi.core.score.min'] ? parseFloat(cmiData['cmi.core.score.min']) : null,
      total_time: cmiData['cmi.core.total_time'],
      session_time: cmiData['cmi.core.session_time'],
      suspend_data: cmiData['cmi.suspend_data'],
      launch_data: cmiData['cmi.launch_data'],
      comments: cmiData['cmi.comments'],
      interactions: cmiData['cmi.interactions'] || [],
      objectives: cmiData['cmi.objectives'] || [],
      // last_accessed is updated by a trigger in the database
    };

    // Use upsert to create or update the tracking record for this user and course.
    // The primary key should be on (user_id, scorm_course_id).
    const { data, error } = await supabaseClient
      .from('scorm_tracking')
      .upsert(trackingData, { onConflict: 'user_id,scorm_course_id' })
      .select()
      .single(); // We expect a single record back

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/*
Sample cmiData payload for reference:
{
  "cmi.core.student_id": "12345",
  "cmi.core.student_name": "John Doe",
  "cmi.core.lesson_location": "page_3",
  "cmi.core.credit": "credit",
  "cmi.core.lesson_status": "incomplete",
  "cmi.core.entry": "ab-initio",
  "cmi.core.score.raw": "85",
  "cmi.core.score.max": "100",
  "cmi.core.score.min": "0",
  "cmi.core.total_time": "00:30:00",
  "cmi.core.lesson_mode": "normal",
  "cmi.core.exit": "suspend",
  "cmi.core.session_time": "00:10:00",
  "cmi.suspend_data": "user_progress_data_here",
  "cmi.launch_data": "initial_launch_data_here"
}
*/
