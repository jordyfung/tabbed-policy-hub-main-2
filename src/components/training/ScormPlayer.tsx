import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    API?: any;
  }
}

interface ScormPlayerProps {
  manifestUrl: string;
  scormCourseId: string;
}

const ScormPlayer: React.FC<ScormPlayerProps> = ({ manifestUrl, scormCourseId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = React.useState<string>('');

  console.log('ScormPlayer rendered with:', { manifestUrl, scormCourseId });

  React.useEffect(() => {
    // Fetch the SCORM content and create a data URL to bypass Content-Type header issues
    const loadCourse = async () => {
      try {
        console.log('Fetching SCORM content from:', manifestUrl);
        const response = await fetch(manifestUrl);
        const htmlContent = await response.text();

        // Create a data URL with proper content type
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        setIframeSrc(dataUrl);
        console.log('SCORM content loaded as data URL');
      } catch (error) {
        console.error('Error loading SCORM content:', error);
        // Fallback to direct URL if data URL fails
        setIframeSrc(manifestUrl);
      }
    };

    loadCourse();
  }, [manifestUrl]);

  useEffect(() => {
    console.log('Attaching SCORM API to window');
    let initialized = false;
    let lastError = '0';

    const cmi: Record<string, any> = {};

    const safeString = (value: unknown) => (value == null ? '' : String(value));

    const LMSInitialize = () => {
      try {
        if (initialized) {
          console.log('SCORM API: Already initialized');
          return 'true';
        }
        initialized = true;
        lastError = '0';
        console.log('SCORM API: LMSInitialize successful');
        return 'true';
      } catch (e) {
        console.error('SCORM API Error in LMSInitialize:', e);
        lastError = '101';
        return 'false';
      }
    };

    const LMSGetValue = (key: string) => {
      try {
        if (!initialized) {
          lastError = '301';
          console.warn('SCORM API: LMSGetValue called before initialization');
          return '';
        }
        lastError = '0';
        console.log(`SCORM API: LMSGetValue('${key}') ->`, cmi[key]);
        return safeString(cmi[key]);
      } catch (e) {
        console.error('SCORM API Error in LMSGetValue:', e);
        lastError = '201';
        return '';
      }
    };

    const LMSSetValue = (key: string, value: any) => {
      try {
        if (!initialized) {
          lastError = '301';
          console.warn('SCORM API: LMSSetValue called before initialization');
          return 'false';
        }
        cmi[key] = value;
        lastError = '0';
        console.log(`SCORM API: LMSSetValue('${key}', '${value}')`);
        return 'true';
      } catch (e) {
        console.error('SCORM API Error in LMSSetValue:', e);
        lastError = '201';
        return 'false';
      }
    };

    const LMSCommit = () => {
      try {
        if (!initialized) {
          lastError = '301';
          console.warn('SCORM API: LMSCommit called before initialization');
          return 'false';
        }
        console.log('SCORM API: LMSCommit called. Persisting data to Supabase...');
        void supabase.functions.invoke('scorm-api', {
          body: {
            type: 'LMSCommit',
            payload: {
              scormCourseId,
              cmiData: cmi,
            },
          },
        });
        lastError = '0';
        return 'true';
      } catch (e) {
        console.error('SCORM API Error in LMSCommit:', e);
        lastError = '101';
        return 'false';
      }
    };

    const LMSFinish = () => {
      try {
        console.log('SCORM API: LMSFinish called');
        const result = LMSCommit();
        initialized = false;
        return result;
      } catch (e) {
        console.error('SCORM API Error in LMSFinish:', e);
        lastError = '101';
        return 'false';
      }
    };

    const LMSGetLastError = () => lastError;
    const LMSGetErrorString = (_code: string) => '';
    const LMSGetDiagnostic = (_code: string) => '';

    const API = {
      LMSInitialize,
      LMSGetValue,
      LMSSetValue,
      LMSCommit,
      LMSFinish,
      LMSGetLastError,
      LMSGetErrorString,
      LMSGetDiagnostic,
    };

    // Expose API on the hosting window so the SCO inside the iframe can find it
    window.API = API;

    const handleBeforeUnload = () => {
      try {
        LMSFinish();
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('Detaching SCORM API from window');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        if (window.API) delete window.API;
      } catch {}
    };
  }, [scormCourseId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '80vh', overflow: 'hidden' }}>
      {!iframeSrc ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading SCORM course...
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="SCORM Course Player"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};

export default ScormPlayer;