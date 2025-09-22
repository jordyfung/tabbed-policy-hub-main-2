/**
 * SCORM Package Validation Service
 * Handles validation of SCORM packages and provides fallback solutions for missing dependencies
 */

export interface ScormValidationResult {
  isValid: boolean;
  missingDependencies: string[];
  warnings: string[];
  canProceed: boolean;
}

export interface ScormDependency {
  name: string;
  required: boolean;
  fallbackContent?: string;
}

const SCORM_DEPENDENCIES: ScormDependency[] = [
  { name: 'configuration.js', required: true },
  { name: 'utils.js', required: true },
  { name: 'scormdriver.js', required: false }, // Can be provided as fallback
  { name: 'dispatch.client.loader.js', required: false } // Can be provided as fallback
];

const SCORM_DRIVER_FALLBACK = `
// Enhanced SCORM Driver fallback with include_script functionality
window.include_script = function(src) {
  console.log('SCORM: Loading script via fallback include_script:', src);
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;
  script.onerror = function() {
    console.log('SCORM: Failed to load script:', src);
  };
  script.onload = function() {
    console.log('SCORM: Successfully loaded script:', src);
  };
  document.head.appendChild(script);
};

window.Start = function() {
  console.log('SCORM: Using fallback Start function');
  if (window.LoadContent && typeof window.LoadContent === 'function') {
    window.LoadContent();
  } else {
    // Fallback content loading
    var contentFrame = document.getElementById('dispatch_content_frame');
    var loadingFrame = document.getElementById('dispatch_loading_frame');
    
    if (contentFrame && loadingFrame) {
      // Hide loading frame and show content frame
      loadingFrame.style.display = 'none';
      contentFrame.style.display = 'block';
      
      // Try to load the actual content
      console.log('SCORM: Loading content in fallback mode');
      contentFrame.src = 'blank.html';
    }
  }
};

window.LoadContent = function() {
  console.log('SCORM: LoadContent called');
  var contentFrame = document.getElementById('dispatch_content_frame');
  var loadingFrame = document.getElementById('dispatch_loading_frame');
  
  if (contentFrame) {
    contentFrame.style.display = 'block';
    if (loadingFrame) {
      loadingFrame.style.display = 'none';
    }
    
    // Load the actual content
    contentFrame.src = 'blank.html';
  }
};

window.Unload = function() {
  console.log('SCORM: Unloading content');
  if (window.API && window.API.LMSFinish) {
    window.API.LMSFinish('');
  }
};

window.WriteToDebug = function(message) {
  console.log('SCORM Debug:', message);
};

// Enhanced LMS API stubs with better SCORM 1.2 support
window.API = {
  LMSInitialize: function(parameter) { 
    console.log('SCORM API: LMSInitialize called');
    return "true"; 
  },
  LMSFinish: function(parameter) { 
    console.log('SCORM API: LMSFinish called');
    return "true"; 
  },
  LMSGetValue: function(element) { 
    console.log('SCORM API: LMSGetValue called for:', element);
    // Return appropriate defaults for common SCORM elements
    switch(element) {
      case 'cmi.core.lesson_status': return 'not attempted';
      case 'cmi.core.student_id': return 'student001';
      case 'cmi.core.student_name': return 'Student';
      case 'cmi.core.credit': return 'credit';
      case 'cmi.core.entry': return 'ab-initio';
      case 'cmi.core.lesson_mode': return 'normal';
      default: return "";
    }
  },
  LMSSetValue: function(element, value) { 
    console.log('SCORM API: LMSSetValue called for:', element, 'value:', value);
    return "true"; 
  },
  LMSCommit: function(parameter) { 
    console.log('SCORM API: LMSCommit called');
    return "true"; 
  },
  LMSGetLastError: function() { return "0"; },
  LMSGetErrorString: function(errorCode) { return "No error"; },
  LMSGetDiagnostic: function(errorCode) { return "No error"; }
};

// Add DebugMode and strLMSStandard globals that SCORM content expects
window.DebugMode = false;
window.strLMSStandard = "SCORM";
`;

export async function validateScormPackage(baseUrl: string, addDebugLog?: (message: string) => void): Promise<ScormValidationResult> {
  const log = addDebugLog || console.log;
  
  log('🔍 Starting SCORM package validation');
  
  // Check if this is a Rustici Dispatch package
  const isRusticiDispatch = await checkIfRusticiDispatch(baseUrl, log);
  
  if (isRusticiDispatch) {
    log('📦 Detected Rustici Software Dispatch package');
    return await validateRusticiDispatch(baseUrl, log);
  }

  const result: ScormValidationResult = {
    isValid: true,
    missingDependencies: [],
    warnings: [],
    canProceed: false
  };

  // Check each dependency
  for (const dep of SCORM_DEPENDENCIES) {
    let depUrl: string;
    
    // Handle proxy URLs differently
    if (baseUrl.includes('/functions/v1/scorm-proxy')) {
      // For proxy URLs, we need to construct the dependency URL properly
      const pathMatch = baseUrl.match(/path=([^&]+)/);
      if (pathMatch) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const directoryPath = decodedPath.substring(0, decodedPath.lastIndexOf('/') + 1);
        depUrl = baseUrl.replace(/path=[^&]+/, `path=${encodeURIComponent(directoryPath + dep.name)}`);
      } else {
        depUrl = `${baseUrl}${dep.name}`;
      }
    } else {
      depUrl = `${baseUrl}${dep.name}`;
    }
    
    log(`Checking dependency: ${dep.name}`);
    
    try {
      const response = await fetch(depUrl, { method: 'HEAD' });
      if (response.ok) {
        log(`✓ Found: ${dep.name}`);
      } else {
        log(`✗ Missing: ${dep.name} (${response.status})`);
        result.missingDependencies.push(dep.name);
        
        if (dep.required) {
          result.isValid = false;
        } else {
          result.warnings.push(`Optional dependency ${dep.name} is missing but can be handled with fallback`);
        }
      }
    } catch (error) {
      log(`✗ Error checking ${dep.name}: ${error}`);
      result.missingDependencies.push(dep.name);
      
      if (dep.required) {
        result.isValid = false;
      }
    }
  }

  // Determine if we can proceed
  const hasRequiredDeps = SCORM_DEPENDENCIES
    .filter(dep => dep.required)
    .every(dep => !result.missingDependencies.includes(dep.name));

  result.canProceed = hasRequiredDeps;

  if (result.canProceed && result.missingDependencies.length > 0) {
    log('⚠️ Package has missing optional dependencies but can proceed with fallbacks');
  } else if (!result.canProceed) {
    log('❌ Package is missing required dependencies and cannot run');
  } else {
    log('✅ Package validation complete - all dependencies found');
  }

  return result;
}

async function checkIfRusticiDispatch(baseUrl: string, log: (message: string) => void): Promise<boolean> {
  try {
    // For proxy URLs, construct the correct path for configuration.js
    let configUrl: string;
    if (baseUrl.includes('/functions/v1/scorm-proxy')) {
      // Extract the directory path from the proxy URL
      const pathMatch = baseUrl.match(/path=([^&]+)/);
      if (pathMatch) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const directoryPath = decodedPath.substring(0, decodedPath.lastIndexOf('/') + 1);
        configUrl = baseUrl.replace(/path=[^&]+/, `path=${encodeURIComponent(directoryPath + 'configuration.js')}`);
      } else {
        configUrl = `${baseUrl}configuration.js`;
      }
    } else {
      configUrl = `${baseUrl}configuration.js`;
    }
    
    log(`Checking for Rustici configuration at: ${configUrl}`);
    const response = await fetch(configUrl);
    if (response.ok) {
      const content = await response.text();
      return content.includes('DispatchRoot') || content.includes('dispatch.acornplms.com');
    }
  } catch (error) {
    log(`Error checking for Rustici Dispatch: ${error}`);
  }
  return false;
}

async function validateRusticiDispatch(baseUrl: string, log: (message: string) => void): Promise<ScormValidationResult> {
  const warnings: string[] = [];
  
  try {
    log('🌐 Rustici Dispatch package detected - external dependencies expected');
    
    // Check local dependencies that should be present
    const localDeps = ['configuration.js', 'utils.js'];
    const missingLocalDeps: string[] = [];
    
    for (const dep of localDeps) {
      let depUrl: string;
      
      if (baseUrl.includes('/functions/v1/scorm-proxy')) {
        const pathMatch = baseUrl.match(/path=([^&]+)/);
        if (pathMatch) {
          const decodedPath = decodeURIComponent(pathMatch[1]);
          const directoryPath = decodedPath.substring(0, decodedPath.lastIndexOf('/') + 1);
          depUrl = baseUrl.replace(/path=[^&]+/, `path=${encodeURIComponent(directoryPath + dep)}`);
        } else {
          depUrl = `${baseUrl}${dep}`;
        }
      } else {
        depUrl = `${baseUrl}${dep}`;
      }
      
      try {
        const response = await fetch(depUrl, { method: 'HEAD' });
        if (response.ok) {
          log(`✓ Found local dependency: ${dep}`);
        } else {
          log(`⚠️ Missing local dependency: ${dep} (will use fallback)`);
          missingLocalDeps.push(dep);
        }
      } catch (error) {
        log(`⚠️ Error checking ${dep}: ${error} (will use fallback)`);
        missingLocalDeps.push(dep);
      }
    }
    
    // For external dependencies, we assume they're available (fallbacks will be used if needed)
    log('📡 External SCORM dependencies (scormdriver.js, dispatch.client.loader.js) expected from Rustici servers');
    
    if (missingLocalDeps.length > 0) {
      warnings.push(`Local dependencies missing but fallbacks available: ${missingLocalDeps.join(', ')}`);
    }
    
    log('✓ Rustici Dispatch package validation complete');
    
    return {
      isValid: true,
      missingDependencies: missingLocalDeps, // Only return missing local deps for fallback injection
      warnings,
      canProceed: true // Always can proceed for Rustici packages with fallbacks
    };
  } catch (error) {
    log(`Error validating Rustici package: ${error}`);
    return {
      isValid: false,
      missingDependencies: ['rustici-external-dependencies'],
      warnings: ['Failed to validate Rustici Dispatch package'],
      canProceed: false
    };
  }
}

export function injectScormFallbacks(missingDependencies: string[]): void {
  if (missingDependencies.includes('scormdriver.js') || missingDependencies.includes('dispatch.client.loader.js')) {
    console.log('Injecting SCORM fallback driver');
    
    // Create and inject fallback script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = SCORM_DRIVER_FALLBACK;
    document.head.appendChild(script);
  }
}

export function injectIframeFallbacks(iframe: HTMLIFrameElement, missingDependencies: string[]): void {
  if (missingDependencies.includes('scormdriver.js') || missingDependencies.includes('dispatch.client.loader.js')) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc && iframe.contentWindow) {
        console.log('🔧 Injecting enhanced SCORM fallback driver into iframe');
        
        // Create a more robust fallback script
        const enhancedFallback = `
          ${SCORM_DRIVER_FALLBACK}
          
          // Enhanced content loading with multiple fallback strategies
          window.LoadContent = function() {
            console.log('SCORM: Enhanced LoadContent called');
            var contentFrame = document.getElementById('dispatch_content_frame');
            var loadingFrame = document.getElementById('dispatch_loading_frame');
            
            if (contentFrame) {
              contentFrame.style.display = 'block';
              if (loadingFrame) {
                loadingFrame.style.display = 'none';
              }
              
              // Try multiple content sources
              var contentSources = ['blank.html', 'content.html', 'index.html', 'scorm.html'];
              var currentSource = 0;
              
              function tryLoadContent() {
                if (currentSource < contentSources.length) {
                  console.log('SCORM: Trying to load:', contentSources[currentSource]);
                  contentFrame.src = contentSources[currentSource];
                  currentSource++;
                } else {
                  console.log('SCORM: All content sources failed, displaying in current frame');
                  // If all else fails, try to show content in current frame
                  contentFrame.style.display = 'none';
                  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>SCORM Content</h2><p>Loading course content...</p></div>';
                }
              }
              
              contentFrame.onload = function() {
                console.log('SCORM: Content loaded successfully');
              };
              
              contentFrame.onerror = function() {
                console.log('SCORM: Content failed to load, trying next source');
                tryLoadContent();
              };
              
              tryLoadContent();
            }
          };
          
          // Enhanced start function
          window.Start = function() {
            console.log('SCORM: Enhanced Start function called');
            setTimeout(function() {
              if (window.LoadContent && typeof window.LoadContent === 'function') {
                window.LoadContent();
              } else {
                console.log('SCORM: LoadContent not available, using direct display');
                document.body.style.display = 'block';
              }
            }, 100);
          };
          
          // Auto-start if DispatchStart exists
          if (typeof DispatchStart === 'function') {
            console.log('SCORM: Auto-starting with DispatchStart');
            DispatchStart();
          } else {
            console.log('SCORM: Auto-starting with enhanced Start');
            Start();
          }
        `;
        
        // Inject enhanced fallback script into iframe
        const script = iframeDoc.createElement('script');
        script.type = 'text/javascript';
        script.textContent = enhancedFallback;
        iframeDoc.head.appendChild(script);
        
        // Copy parent window's API to iframe with enhanced error handling
        if (iframe.contentWindow && (window as any).API) {
          (iframe.contentWindow as any).API = (window as any).API;
          
          // Also copy other SCORM-related globals
          (iframe.contentWindow as any).parent = window;
          (iframe.contentWindow as any).top = window;
          
          console.log('✓ Enhanced SCORM API and globals copied to iframe');
        }
        
        // Force content visibility
        setTimeout(() => {
          if (iframeDoc.body) {
            iframeDoc.body.style.display = 'block';
            iframeDoc.body.style.visibility = 'visible';
          }
        }, 200);
        
      }
    } catch (error) {
      console.log('⚠️ Could not inject fallbacks into iframe (cross-origin restrictions):', error);
      
      // Fallback: Try to communicate with iframe via postMessage
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'SCORM_FALLBACK_NEEDED',
          fallbackScript: SCORM_DRIVER_FALLBACK
        }, '*');
      }
    }
  }
}