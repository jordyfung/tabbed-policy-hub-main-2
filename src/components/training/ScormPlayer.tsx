import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ScormPlayerProps {
  manifestUrl: string;
  scormCourseId: string;
}

const ScormPlayer: React.FC<ScormPlayerProps> = ({ manifestUrl, scormCourseId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const cmi = {};

    const LMSInitialize = () => {
      console.log('LMSInitialize');
      return 'true';
    };

    const LMSGetValue = (key: string) => {
      console.log('LMSGetValue', key);
      return cmi[key] || '';
    };

    const LMSSetValue = (key: string, value: any) => {
      console.log('LMSSetValue', key, value);
      cmi[key] = value;
      return 'true';
    };

    const LMSCommit = () => {
      console.log('LMSCommit');
      supabase.functions.invoke('scorm-api', {
        body: {
          type: 'LMSCommit',
          payload: {
            scormCourseId,
            cmiData: cmi,
          },
        },
      });
      return 'true';
    };

    const LMSFinish = () => {
      console.log('LMSFinish');
      LMSCommit();
      return 'true';
    };

    const API = {
      LMSInitialize,
      LMSGetValue,
      LMSSetValue,
      LMSCommit,
      LMSFinish,
    };

    (iframe.contentWindow as any).API = API;
  }, [scormCourseId]);

  return (
    <iframe
      ref={iframeRef}
      src={manifestUrl}
      width="100%"
      height="600px"
      title="SCORM Player"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};

export default ScormPlayer;