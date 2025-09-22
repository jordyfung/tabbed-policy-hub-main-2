import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import JSZip from 'https://esm.sh/jszip@3.10.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScormManifest {
  title: string
  description?: string
  duration?: string
  entryPoint: string
  version: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { fileName, courseId } = await req.json()

    console.log(`Processing SCORM package: ${fileName} for course: ${courseId}`)

    // Download the uploaded ZIP file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('scorm-packages')
      .download(`uploads/${fileName}`)

    if (downloadError) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Convert blob to array buffer and extract ZIP
    const arrayBuffer = await fileData.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const allFiles = Object.keys(zip.files)
    console.log(`Extracted ${allFiles.length} files from ZIP`)
    console.log('Files in package:', allFiles)

    // Find and parse the manifest file
    const manifestFile = zip.files['imsmanifest.xml']
    if (!manifestFile) {
      throw new Error('imsmanifest.xml not found in SCORM package')
    }

    const manifestContent = await manifestFile.async('text')
    const manifest = parseScormManifest(manifestContent)

    console.log('Parsed manifest:', manifest)

    // Upload extracted files to storage
    const uploadPromises = Object.entries(zip.files).map(async ([filePath, file]) => {
      // Skip directories
      if (file.dir) {
        console.log(`Skipping directory: ${filePath}`)
        return null
      }
      
      console.log(`Processing file: ${filePath}`)
      const fileContent = await file.async('uint8array')
      const storagePath = `content/${courseId}/${filePath}`
      
      // Determine content type based on file extension
      const contentType = getContentType(filePath)
      console.log(`Uploading ${filePath} as ${contentType} to ${storagePath}`)
      
      const { error } = await supabase.storage
        .from('scorm-packages')
        .upload(storagePath, fileContent, {
          contentType,
          upsert: true
        })

      if (error) {
        console.error(`Failed to upload ${filePath}:`, error)
        throw error
      }

      console.log(`Successfully uploaded: ${filePath}`)
      return storagePath
    })

    await Promise.all(uploadPromises.filter(p => p !== null))
    console.log('All files uploaded successfully')

    // Update course record with SCORM metadata
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        course_type: 'scorm',
        scorm_package_path: `content/${courseId}/`,
        scorm_manifest_data: {
          title: manifest.title,
          description: manifest.description,
          duration: manifest.duration,
          version: manifest.version
        },
        scorm_entry_point: manifest.entryPoint,
        title: manifest.title,
        description: manifest.description || ''
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update course: ${updateError.message}`)
    }

    console.log('Course updated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SCORM package processed successfully',
        manifest
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('SCORM processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function parseScormManifest(manifestXml: string): ScormManifest {
  // Enhanced XML parsing for SCORM manifest with multiple title sources
  
  // Try organization title first (most descriptive)
  let titleMatch = manifestXml.match(/<organization[^>]*><title[^>]*>([^<]+)<\/title>/i)
  
  // Fall back to manifest title
  if (!titleMatch) {
    titleMatch = manifestXml.match(/<manifest[^>]*><metadata[^>]*>.*?<title[^>]*>([^<]+)<\/title>/is)
  }
  
  // Fall back to first title found
  if (!titleMatch) {
    titleMatch = manifestXml.match(/<title[^>]*>([^<]+)<\/title>/i)
  }
  
  // Extract other metadata
  const descMatch = manifestXml.match(/<description[^>]*>([^<]+)<\/description>/i)
  const hrefMatch = manifestXml.match(/<resource[^>]*href="([^"]+)"/i)
  const durationMatch = manifestXml.match(/<adlcp:maxtimeallowed>([^<]+)<\/adlcp:maxtimeallowed>/i)
  
  // Clean up title text (remove extra whitespace and decode entities)
  const rawTitle = titleMatch?.[1] || 'SCORM Course'
  const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim()
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
  
  return {
    title: cleanTitle,
    description: descMatch?.[1]?.trim(),
    duration: durationMatch?.[1]?.trim(),
    entryPoint: hrefMatch?.[1] || 'index.html',
    version: '1.2'
  }
}

function getContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()
  
  const contentTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'pdf': 'application/pdf'
  }
  
  return contentTypes[extension || ''] || 'application/octet-stream'
}