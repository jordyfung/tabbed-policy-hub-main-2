import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const filePath = url.searchParams.get('path')
    
    if (!filePath) {
      return new Response('Missing path parameter', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('scorm-packages')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      return new Response(`File not found: ${downloadError.message}`, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Determine content type based on file extension
    const contentType = getContentType(filePath)
    
    // For HTML files, ensure proper charset
    const finalContentType = contentType === 'text/html' 
      ? 'text/html; charset=utf-8' 
      : contentType

    console.log(`Serving ${filePath} as ${finalContentType}`)

    // Define a more permissive CSP for SCORM content
    const scormCSP = [
      "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:",
      "script-src 'self' * 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' * 'unsafe-inline'",
      "img-src 'self' * data: blob:",
      "font-src 'self' * data:",
      "connect-src 'self' * data: blob:",
      "frame-src 'self' * data: blob:",
    ].join('; ');

    // Return the response with minimal required headers
    return new Response(fileData, {
      headers: {
        'Content-Type': finalContentType,
        'Content-Security-Policy': scormCSP,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('SCORM proxy error:', error)
    return new Response(
      `Proxy error: ${error.message}`,
      {
        headers: corsHeaders,
        status: 500
      }
    )
  }
})

function getContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()
  
  const contentTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'pdf': 'application/pdf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  }
  
  return contentTypes[extension || ''] || 'application/octet-stream'
}