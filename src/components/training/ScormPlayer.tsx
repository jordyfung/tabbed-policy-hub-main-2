import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { X, ExternalLink, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { validateScormPackage, injectScormFallbacks, injectIframeFallbacks } from '@/lib/scormValidation';

interface ScormPlayerProps {
  courseId: string;
  courseName: string;
  entryPoint: string;
  packagePath: string;
  onClose: () => void;
}

interface ScormData {
  lesson_status: string;
  lesson_location: string;
  completion_status: string;
  success_status: string;
  score_raw: number;
  score_min: number;
  score_max: number;
  total_time: string;
  session_time: string;
  cmi_data: Record<string, any>;
}

interface LoadingState {
  isLoading: boolean;
  loadingStage: string;
  progress: number;
  errors: string[];
  warnings: string[];
}

export default function ScormPlayer({ 
  courseId, 
  courseName, 
  entryPoint, 
  packagePath, 
  onClose 
}: ScormPlayerProps) {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [scormData, setScormData] = useState<ScormData>({
    lesson_status: 'not attempted',
    lesson_location: '',
    completion_status: 'unknown',
    success_status: 'unknown',
    score_raw: 0,
    score_min: 0,
    score_max: 100,
    total_time: '0000:00:00.00',
    session_time: '0000:00:00.00',
    cmi_data: {}
  });
  const [error, setError] = useState<string>('');
  const [isInNewWindow, setIsInNewWindow] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    loadingStage: 'Initializing...',
    progress: 0,
    errors: [],
    warnings: []
  });
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const processContentUrl = (url: string): string => {
    // Handle Rustici Dispatch parameter substitution
    if (url.includes('LEARNER_ID') || url.includes('dispatch.acornplms.com')) {
      addDebugLog('🔧 Processing Rustici Dispatch URL parameters');
      
      // Get user data from auth context
      const userId = user?.id || 'guest';
      const firstName = 'User'; // Could get from profile if available
      const lastName = 'Guest';
      
      let processedUrl = url
        .replace(/LEARNER_ID/g, userId)
        .replace(/LEARNER_FNAME/g, encodeURIComponent(firstName))
        .replace(/LEARNER_LNAME/g, encodeURIComponent(lastName));
      
      // Handle pipe URL for data communication
      const currentOrigin = window.location.origin;
      processedUrl = processedUrl.replace(/PIPE_URL/g, `${currentOrigin}/api/scorm-pipe`);
      
      // Handle redirect URL
      processedUrl = processedUrl.replace(/REDIRECT_URL_REGISTRATION_ARGUMENT/g, `${currentOrigin}/training`);
      
      addDebugLog('✓ Rustici URL parameters processed');
      return processedUrl;
    }
    
    return url;
  };

  // Use proxy for better content-type handling when not a Rustici Dispatch URL
  const baseStorageUrl = `https://prpfrwqqsxqsikehzosd.supabase.co/storage/v1/object/public/scorm-packages/${packagePath}${entryPoint}`;
  const shouldUseProxy = !entryPoint.includes('dispatch.acornplms.com') && !entryPoint.startsWith('http');
  
  const contentUrl = shouldUseProxy 
    ? processContentUrl(`https://prpfrwqqsxqsikehzosd.supabase.co/functions/v1/scorm-proxy?path=${encodeURIComponent(packagePath + entryPoint)}`)
    : processContentUrl(baseStorageUrl);

  useEffect(() => {
    initializeScormPlayer();
    const cleanupPostMessage = setupPostMessageCommunication();
    
    return () => {
      // Save final session data on cleanup
      saveScormSession();
      cleanupPostMessage();
    };
  }, []);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`SCORM Debug: ${message}`);
  };

  const updateLoadingState = (updates: Partial<LoadingState>) => {
    setLoadingState(prev => ({ ...prev, ...updates }));
  };

  const initializeScormPlayer = async () => {
    try {
      updateLoadingState({ loadingStage: 'Loading session data...', progress: 20 });
      addDebugLog('Starting SCORM player initialization');
      
      await loadScormSession();
      
      updateLoadingState({ loadingStage: 'Setting up SCORM API...', progress: 40 });
      setupScormAPI();
      
      updateLoadingState({ loadingStage: 'Checking content availability...', progress: 60 });
      await validateScormContent();
      
      updateLoadingState({ loadingStage: 'Ready', progress: 100, isLoading: false });
      addDebugLog('SCORM player initialization complete');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateLoadingState({ 
        errors: [errorMessage], 
        isLoading: false, 
        loadingStage: 'Error' 
      });
      addDebugLog(`Initialization failed: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const validateScormContent = async () => {
    try {
      addDebugLog(`Validating content URL: ${contentUrl}`);
      
      // Check if main entry point is accessible
      const response = await fetch(contentUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Content not accessible: ${response.status} ${response.statusText}`);
      }
      
      addDebugLog('Main content file is accessible');
      
      // Validate SCORM package dependencies
      // For proxy URLs, pass the contentUrl as-is since the validation logic handles the path construction
      const baseUrl = shouldUseProxy ? contentUrl : contentUrl.substring(0, contentUrl.lastIndexOf('/') + 1);
      const validationResult = await validateScormPackage(baseUrl, addDebugLog);
      
      if (validationResult.warnings.length > 0) {
        setLoadingState(prev => ({ 
          ...prev, 
          warnings: [...prev.warnings, ...validationResult.warnings] 
        }));
      }
      
      if (!validationResult.canProceed) {
        throw new Error(`SCORM package validation failed: Missing required dependencies: ${validationResult.missingDependencies.join(', ')}`);
      }
      
      // Inject fallbacks for missing optional dependencies
      if (validationResult.missingDependencies.length > 0) {
        addDebugLog('📦 Injecting SCORM fallbacks for missing dependencies');
        injectScormFallbacks(validationResult.missingDependencies);
        
        // Also set up iframe fallbacks if iframe is available
        if (iframeRef.current) {
          injectIframeFallbacks(iframeRef.current, validationResult.missingDependencies);
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Content validation failed';
      addDebugLog(`Content validation error: ${errorMessage}`);
      throw error;
    }
  };

  const loadScormSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scorm_sessions')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading SCORM session:', error);
        return;
      }

      if (data) {
        setScormData({
          lesson_status: data.lesson_status || 'not attempted',
          lesson_location: data.lesson_location || '',
          completion_status: data.completion_status || 'unknown',
          success_status: data.success_status || 'unknown',
          score_raw: data.score_raw || 0,
          score_min: data.score_min || 0,
          score_max: data.score_max || 100,
          total_time: data.total_time || '0000:00:00.00',
          session_time: data.session_time || '0000:00:00.00',
          cmi_data: (data.cmi_data as Record<string, any>) || {}
        });
      }
    } catch (error) {
      console.error('Error loading SCORM session:', error);
    }
  };

  const saveScormSession = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('scorm_sessions')
        .upsert({
          course_id: courseId,
          user_id: user.id,
          session_id: sessionId,
          ...scormData
        }, {
          onConflict: 'course_id,user_id,session_id'
        });

      if (error) {
        console.error('Error saving SCORM session:', error);
      }
    } catch (error) {
      console.error('Error saving SCORM session:', error);
    }
  };

  const setupScormAPI = () => {
    addDebugLog('Setting up SCORM 1.2 API');
    
    // SCORM 1.2 API Implementation
    (window as any).API = {
      LMSInitialize: () => {
        addDebugLog('SCORM API: LMSInitialize called');
        return 'true';
      },
      
      LMSFinish: () => {
        addDebugLog('SCORM API: LMSFinish called');
        saveScormSession();
        return 'true';
      },
      
      LMSGetValue: (element: string) => {
        addDebugLog(`SCORM API: LMSGetValue called for ${element}`);
        
        switch (element) {
          case 'cmi.core.lesson_status':
            return scormData.lesson_status;
          case 'cmi.core.lesson_location':
            return scormData.lesson_location;
          case 'cmi.core.score.raw':
            return scormData.score_raw.toString();
          case 'cmi.core.score.min':
            return scormData.score_min.toString();
          case 'cmi.core.score.max':
            return scormData.score_max.toString();
          case 'cmi.core.total_time':
            return scormData.total_time;
          case 'cmi.core.session_time':
            return scormData.session_time;
          case 'cmi.core.student_id':
            return user?.id || '';
          case 'cmi.core.student_name':
            return user?.email || '';
          default:
            return scormData.cmi_data[element] || '';
        }
      },
      
      LMSSetValue: (element: string, value: string) => {
        addDebugLog(`SCORM API: LMSSetValue called for ${element} with value ${value}`);
        
        const newScormData = { ...scormData };
        
        switch (element) {
          case 'cmi.core.lesson_status':
            newScormData.lesson_status = value;
            break;
          case 'cmi.core.lesson_location':
            newScormData.lesson_location = value;
            break;
          case 'cmi.core.score.raw':
            newScormData.score_raw = parseInt(value) || 0;
            break;
          case 'cmi.core.score.min':
            newScormData.score_min = parseInt(value) || 0;
            break;
          case 'cmi.core.score.max':
            newScormData.score_max = parseInt(value) || 100;
            break;
          case 'cmi.core.session_time':
            newScormData.session_time = value;
            break;
          default:
            newScormData.cmi_data[element] = value;
        }
        
        setScormData(newScormData);
        return 'true';
      },
      
      LMSCommit: () => {
        addDebugLog('SCORM API: LMSCommit called');
        saveScormSession();
        return 'true';
      },
      
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => 'No error',
      LMSGetDiagnostic: () => 'No error'
    };
    
    addDebugLog('SCORM API setup complete');
  };

  const setupPostMessageCommunication = () => {
    addDebugLog('🔗 Setting up postMessage communication for cross-origin SCORM');
    
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the Supabase storage domain or Rustici domains
      const allowedOrigins = [
        'https://prpfrwqqsxqsikehzosd.supabase.co',
        'https://learning.prod-gov1-ap-southeast-2.dispatch.acornplms.com',
        'https://dispatch.acornplms.com'
      ];
      
      if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) {
        return;
      }
      
      const { type, method, element, value, messageId } = event.data;
      
      if (type === 'SCORM_API_CALL') {
        addDebugLog(`📨 Received SCORM API call: ${method}(${element}, ${value})`);
        
        let result = '';
        
        switch (method) {
          case 'LMSInitialize':
            result = (window as any).API.LMSInitialize();
            break;
          case 'LMSFinish':
            result = (window as any).API.LMSFinish();
            break;
          case 'LMSGetValue':
            result = (window as any).API.LMSGetValue(element);
            break;
          case 'LMSSetValue':
            result = (window as any).API.LMSSetValue(element, value);
            break;
          case 'LMSCommit':
            result = (window as any).API.LMSCommit();
            break;
          case 'LMSGetLastError':
            result = (window as any).API.LMSGetLastError();
            break;
          case 'LMSGetErrorString':
            result = (window as any).API.LMSGetErrorString();
            break;
          case 'LMSGetDiagnostic':
            result = (window as any).API.LMSGetDiagnostic();
            break;
        }
        
        // Send response back to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'SCORM_API_RESPONSE',
            messageId,
            result
          }, '*');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  };

  const monitorIframeContent = () => {
    // Skip direct iframe monitoring for cross-origin content
    addDebugLog('📊 Skipping direct iframe monitoring due to cross-origin restrictions');
    addDebugLog('✓ Using postMessage communication instead');
  };

  const openInNewWindow = () => {
    addDebugLog('Opening SCORM course in new window');
    
    const newWindow = window.open(
      contentUrl,
      'scorm_player',
      'width=1024,height=768,scrollbars=yes,resizable=yes'
    );
    
    if (newWindow) {
      setIsInNewWindow(true);
      
      // Copy SCORM API to new window
      (newWindow as any).API = (window as any).API;
      addDebugLog('SCORM API copied to new window');
      
      // Monitor when window is closed
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          setIsInNewWindow(false);
          saveScormSession();
          addDebugLog('New window closed, session saved');
        }
      }, 1000);
    } else {
      const errorMsg = 'Pop-up blocked. Please enable pop-ups for this site and try again.';
      setError(errorMsg);
      addDebugLog(`Error: ${errorMsg}`);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">{courseName}</h3>
          <p className="text-sm text-muted-foreground">SCORM Course Player</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openInNewWindow}
            disabled={isInNewWindow || loadingState.isLoading}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {isInNewWindow ? 'Opened in New Window' : 'Open in New Window'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loadingState.isLoading && (
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{loadingState.loadingStage}</span>
          </div>
          <Progress value={loadingState.progress} className="w-full" />
        </div>
      )}

      {/* Errors */}
      {(error || loadingState.errors.length > 0) && (
        <div className="p-4">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {error && <div>{error}</div>}
                {loadingState.errors.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Warnings */}
      {loadingState.warnings.length > 0 && (
        <div className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Warnings:</div>
                {loadingState.warnings.map((warning, idx) => (
                  <div key={idx} className="text-sm">{warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <div className="p-4 border-b">
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Debug Information</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugInfo([])}
              >
                Clear
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto text-xs font-mono space-y-1">
              {debugInfo.length === 0 ? (
                <div className="text-muted-foreground">No debug logs yet</div>
              ) : (
                debugInfo.map((log, idx) => (
                  <div key={idx} className="text-foreground">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        {loadingState.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading SCORM Course</h3>
              <p className="text-muted-foreground mb-4">{loadingState.loadingStage}</p>
              <Progress value={loadingState.progress} className="w-64 mx-auto" />
            </div>
          </div>
        ) : !isInNewWindow ? (
          <iframe
            ref={iframeRef}
            src={contentUrl}
            className="w-full h-full border rounded-lg"
            title={courseName}
            sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups allow-modals allow-downloads allow-presentation"
            onLoad={() => {
              addDebugLog('Iframe content loaded');
              
              // Check if content is rendering properly
              setTimeout(() => {
                try {
                  const iframe = iframeRef.current;
                  if (iframe?.contentDocument || iframe?.contentWindow?.document) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                      const bodyText = iframeDoc.body?.textContent || '';
                      const bodyHTML = iframeDoc.body?.innerHTML || '';
                      
                      // Check if showing raw HTML instead of rendering
                      if (bodyText.includes('<!DOCTYPE') || bodyText.includes('<html') || 
                          (bodyHTML.length < 100 && bodyText.includes('<'))) {
                        addDebugLog('⚠️ Content appears to be showing HTML source instead of rendering');
                        updateLoadingState({ 
                          warnings: [...loadingState.warnings, 'Content may not be displaying correctly. Try opening in a new window.'] 
                        });
                      } else if (bodyHTML.length > 100) {
                        addDebugLog('✓ Content appears to be rendering correctly');
                      }
                    }
                  }
                } catch (e) {
                  // Cross-origin content - this is expected for external SCORM
                  addDebugLog('📊 Cross-origin content detected - using postMessage communication');
                }
              }, 2000);
              
              monitorIframeContent();
              
              // Send initialization message to iframe
              setTimeout(() => {
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.postMessage({
                    type: 'SCORM_API_READY',
                    apiMethods: ['LMSInitialize', 'LMSFinish', 'LMSGetValue', 'LMSSetValue', 'LMSCommit']
                  }, '*');
                  addDebugLog('📤 Sent SCORM API ready message to iframe');
                }
              }, 1000);
            }}
            onError={(e) => {
              addDebugLog('⚠️ Iframe failed to load content');
              console.error('Iframe loading error:', e);
            }}
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Course Opened in New Window</h3>
              <p className="text-muted-foreground mb-4">
                The SCORM course is running in a separate window for the best experience.
              </p>
              <Button variant="outline" onClick={() => setIsInNewWindow(false)}>
                Return to Embedded View
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {scormData.lesson_status === 'completed' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : scormData.lesson_status === 'failed' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Loader2 className="h-4 w-4 text-blue-500" />
              )}
              <span>Status: <span className="font-medium">{scormData.lesson_status}</span></span>
            </div>
            {loadingState.warnings.some(w => w.includes('not displaying correctly')) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={openInNewWindow}
                className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Fix Display Issue
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span>Score: <span className="font-medium">{scormData.score_raw}%</span></span>
            <span>Time: <span className="font-medium">{scormData.session_time}</span></span>
          </div>
        </div>
      </div>
    </Card>
  );
}