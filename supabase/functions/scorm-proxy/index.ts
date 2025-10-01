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
    const externalUrl = url.searchParams.get('external_url')

    // --- START: EXTERNAL URL PROXY LOGIC ---
    // If external_url is present, fetch it and return the response.
    // This turns our function into a CORS proxy for the SCORM content.
    if (externalUrl) {
      console.log(`Proxying external URL: ${externalUrl}`)
      try {
        const externalResponse = await fetch(externalUrl)
        
        // Copy headers from the external response, but ensure our CORS headers are present.
        const headers = new Headers(externalResponse.headers)
        headers.set('Access-Control-Allow-Origin', '*')
        headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])

        return new Response(externalResponse.body, {
          status: externalResponse.status,
          statusText: externalResponse.statusText,
          headers,
        })
      } catch (e) {
        console.error('Error fetching external URL:', e)
        return new Response(`Failed to fetch external URL: ${e.message}`, { 
          status: 502, 
          headers: corsHeaders 
        })
      }
    }
    // --- END: EXTERNAL URL PROXY LOGIC ---
    
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

    // For JavaScript files, rewrite external URLs to use our proxy
    if (finalContentType.startsWith('application/javascript') || finalContentType.startsWith('text/javascript') || filePath.endsWith('.js')) {
      const originalJs = await fileData.text()
      
      // Determine the containing folder (prefix) for resolving relative URLs
      const lastSlash = filePath.lastIndexOf('/')
      const folderPrefix = lastSlash >= 0 ? filePath.slice(0, lastSlash + 1) : ''
      
      // Rewrite DispatchRoot and other external URLs to use our proxy
      const rewrittenJs = originalJs
        .replace(/DispatchRoot\s*=\s*['"][^'"]*['"]/gi, `DispatchRoot = '${url.origin}/functions/v1/scorm-proxy?path=${encodeURIComponent(folderPrefix)}'`)
        .replace(/ContentURL\s*=\s*['"][^'"]*['"]/gi, `ContentURL = '${url.origin}/functions/v1/scorm-proxy?path=${encodeURIComponent(folderPrefix)}'`)
        .replace(/PreLaunchConfigurationURL\s*=\s*['"][^'"]*['"]/gi, `PreLaunchConfigurationURL = '${url.origin}/functions/v1/scorm-proxy?path=${encodeURIComponent(folderPrefix)}'`)
      
      return new Response(rewrittenJs, {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // For HTML files, rewrite to strip CSP meta tags and inject guard to prevent runtime CSP injection
    if (finalContentType.startsWith('text/html')) {
      const originalHtml = await fileData.text()

      // Determine the containing folder (prefix) for resolving relative URLs
      const lastSlash = filePath.lastIndexOf('/')
      const folderPrefix = lastSlash >= 0 ? filePath.slice(0, lastSlash + 1) : ''

      // --- START: FIX FOR DISPATCH PACKAGES ---
      // Attempt to fetch configuration.js from the same directory.
      // This is crucial for dispatch packages that rely on this file.
      let configScript = '';
      try {
        const { data: configFileData, error: configFileError } = await supabase.storage
          .from('scorm-packages')
          .download(`${folderPrefix}configuration.js`)
        
        if (configFileError) {
          console.log('Note: configuration.js not found in this package. Proceeding without it.');
        } else {
          let configContent = await configFileData.text();
          // --- START: REWRITE ContentURL ---
          // Find the ContentURL and wrap it with our proxy.
          const contentUrlRegex = /(ContentURL\s*=\s*['"])([^'"]+)(['"])/i;
          configContent = configContent.replace(contentUrlRegex, (_match, p1, p2, p3) => {
            const proxiedUrl = `${url.origin}/functions/v1/scorm-proxy?external_url=${encodeURIComponent(p2)}`;
            console.log(`Rewriting ContentURL to: ${proxiedUrl}`);
            return `${p1}${proxiedUrl}${p3}`;
          });
          // --- END: REWRITE ContentURL ---
          configScript = `\n<script type="text/javascript">\n// Injected configuration.js\n${configContent}\n</script>\n`;
          console.log('Successfully injected and modified configuration.js for dispatch package.');
        }
      } catch (e) {
        console.warn('Could not process configuration.js, might not be a dispatch package.', e);
      }
      // --- END: FIX FOR DISPATCH PACKAGES ---

      // --- START: INJECT utils.js TO PREVENT "include_script is not defined" ---
      let utilsScript = '';
      try {
        const { data: utilsFileData, error: utilsFileError } = await supabase.storage
          .from('scorm-packages')
          .download(`${folderPrefix}utils.js`);
        
        if (utilsFileError) {
          console.log('Note: utils.js not found in this package. This may be expected.');
        } else {
          const utilsContent = await utilsFileData.text();
          utilsScript = `\n<script type="text/javascript">\n// Injected utils.js\n${utilsContent}\n</script>\n`;
          console.log('Successfully injected utils.js.');
        }
      } catch (e) {
        console.warn('Could not process utils.js.', e);
      }
      // --- END: INJECT utils.js ---

      // Remove any meta CSP tags and any <base> tag present in the HTML
      let rewrittenHtml = originalHtml
        // Remove explicit http-equiv CSP meta tags
        .replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '')
        // Remove meta tags whose content contains CSP (defensive)
        .replace(/<meta[^>]*content=["'][^"']*content-security-policy[^"']*["'][^>]*>/gi, '')
        // Remove existing <base> tags to avoid conflicting URL resolution
        .replace(/<base[^>]*>/gi, '')
        // Rewrite external script URLs to use our proxy
        .replace(/DispatchRoot\s*=\s*['"][^'"]*['"]/gi, `DispatchRoot = '${url.origin}/functions/v1/scorm-proxy?path=${encodeURIComponent(folderPrefix)}'`)
        // Rewrite any external script src attributes to use our proxy
        .replace(/src=["']https?:\/\/[^'"]*dispatch[^'"]*["']/gi, (match) => {
          const externalUrl = match.match(/src=["']([^'"]*)["']/)?.[1]
          if (externalUrl) {
            const fileName = externalUrl.split('/').pop()
            return `src="${url.origin}/functions/v1/scorm-proxy?path=${encodeURIComponent(folderPrefix + fileName)}"`
          }
          return match
        })

      // Inject a guard script right after <head> to block runtime CSP meta insertion
      const guardScript = `\n<script>(function(){\n  const isCspMeta = (el)=>{\n    try{\n      const n = el && el.getAttribute && el.getAttribute('http-equiv');\n      return n && n.toLowerCase() === 'content-security-policy';\n    }catch(e){}\n    return false;\n  };\n  const origAppend = Element.prototype.appendChild;\n  Element.prototype.appendChild = function(child){\n    if(child && child.tagName === 'META' && isCspMeta(child)){\n      console.warn('Blocked CSP meta append');\n      return child;\n    }\n    return origAppend.call(this, child);\n  };\n  const origInsertBefore = Element.prototype.insertBefore;\n  Element.prototype.insertBefore = function(newNode, ref){\n    if(newNode && newNode.tagName === 'META' && isCspMeta(newNode)){\n      console.warn('Blocked CSP meta insertBefore');\n      return newNode;\n    }\n    return origInsertBefore.call(this, newNode, ref);\n  };\n  const origSetAttribute = Element.prototype.setAttribute;\n  Element.prototype.setAttribute = function(name, value){\n    if(this && this.tagName === 'META' && name && name.toLowerCase() === 'http-equiv' && String(value).toLowerCase() === 'content-security-policy'){\n      console.warn('Blocked CSP meta setAttribute');\n      return;\n    }\n    return origSetAttribute.call(this, name, value);\n  };\n  const origWrite = document.write;\n  document.write = function(){\n    try{\n      const str = arguments && arguments[0];\n      if(typeof str === 'string' && /http-equiv\\s*=\\s*["']?content-security-policy["']?/i.test(str)){\n        console.warn('Blocked CSP meta via document.write');\n        return;\n      }\n    }catch(e){}\n    return origWrite.apply(this, arguments);\n  };\n})();</script>\n`;

      // Inject a minimal SCORM 1.2 API shim so the SCO can discover window.API on the same page
      const apiShim = `\n<script>(function(){\n  try {\n    if (!window.API) {\n      var __cmi = {};\n      var __initialized = false;\n      var __lastError = "0";\n      function LMSInitialize(){ __initialized = true; __lastError = "0"; return "true"; }\n      function LMSFinish(){ try { LMSCommit(""); } catch(e) {} __initialized = false; return "true"; }\n      function LMSGetValue(k){ if(!__initialized){ __lastError = "301"; return ""; } __lastError = "0"; return (__cmi[k] != null ? String(__cmi[k]) : ""); }\n      function LMSSetValue(k,v){ if(!__initialized){ __lastError = "301"; return "false"; } __cmi[k] = String(v); __lastError = "0"; return "true"; }\n      function LMSCommit(){ if(!__initialized){ __lastError = "301"; return "false"; } __lastError = "0"; return "true"; }\n      function LMSGetLastError(){ return __lastError; }\n      function LMSGetErrorString(){ return ""; }\n      function LMSGetDiagnostic(){ return ""; }\n      window.API = {\n        LMSInitialize: LMSInitialize,\n        LMSFinish: LMSFinish,\n        LMSGetValue: LMSGetValue,\n        LMSSetValue: LMSSetValue,\n        LMSCommit: LMSCommit,\n        LMSGetLastError: LMSGetLastError,\n        LMSGetErrorString: LMSGetErrorString,\n        LMSGetDiagnostic: LMSGetDiagnostic\n      };\n    }\n  } catch (e) {\n    console.warn('SCORM API shim error', e);\n  }\n})();</script>\n`;

      // Inject <base> to ensure all relative URLs resolve back through this proxy
      const baseTag = `\n<base href="${url.origin}/functions/v1/scorm-proxy?path=${encodeURIComponent(folderPrefix)}">\n`

      if (/<head[^>]*>/i.test(rewrittenHtml)) {
        // Inject config and utils scripts first to ensure variables are defined.
        rewrittenHtml = rewrittenHtml.replace(/<head[^>]*>/i, (m) => m + configScript + utilsScript + baseTag + guardScript + apiShim)
      } else {
        // If no head, prepend scripts at start
        rewrittenHtml = configScript + utilsScript + baseTag + guardScript + apiShim + rewrittenHtml
      }

      return new Response(rewrittenHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline' data: blob:; img-src * data: blob:; font-src * data: blob:; connect-src * data: blob:; frame-src * data: blob:; object-src * data: blob:; media-src * data: blob:",
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // Non-HTML: return as-is with permissive CSP header
    return new Response(fileData, {
      headers: {
        'Content-Type': finalContentType,
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline' data: blob:; img-src * data: blob:; font-src * data: blob:; connect-src * data: blob:; frame-src * data: blob:; object-src * data: blob:; media-src * data: blob:",
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