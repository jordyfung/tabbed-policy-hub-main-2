import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ScormUploadProps {
  onUploadComplete: (courseId: string) => void;
  onCancel: () => void;
}

export default function ScormUpload({ onUploadComplete, onCancel }: ScormUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find(file => file.name.toLowerCase().endsWith('.zip'));
    
    if (zipFile) {
      handleFileUpload(zipFile);
    } else {
      setErrorMessage('Please upload a ZIP file containing a SCORM package.');
      setStatus('error');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      handleFileUpload(file);
    } else {
      setErrorMessage('Please select a ZIP file containing a SCORM package.');
      setStatus('error');
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      // Check authentication and permissions
      if (!user) {
        throw new Error('You must be logged in to upload SCORM packages.');
      }

      if (!isAdmin) {
        throw new Error('Only administrators can upload SCORM packages.');
      }

      setStatus('uploading');
      setUploading(true);
      setUploadProgress(0);
      setErrorMessage('');

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `scorm-${timestamp}-${file.name}`;

      // Upload ZIP file to storage
      setUploadProgress(25);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scorm-packages')
        .upload(`uploads/${fileName}`, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(50);

      // Create a new course record first
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: 'Processing SCORM Package...',
          description: 'SCORM course being processed',
          course_type: 'scorm',
          is_mandatory: false,
          created_by: user.id
        })
        .select()
        .single();

      if (courseError) {
        throw new Error(`Failed to create course: ${courseError.message}`);
      }

      setUploadProgress(75);
      setStatus('processing');

      // Process SCORM package
      const { data: processData, error: processError } = await supabase.functions
        .invoke('process-scorm', {
          body: {
            fileName,
            courseId: courseData.id
          }
        });

      if (processError) {
        throw new Error(`Processing failed: ${processError.message}`);
      }

      if (!processData?.success) {
        throw new Error(processData?.error || 'SCORM processing failed');
      }

      setUploadProgress(100);
      setStatus('success');

      toast({
        title: 'SCORM Package Uploaded',
        description: `Course "${processData.manifest.title}" has been created successfully.`,
      });

      // Notify parent component
      onUploadComplete(courseData.id);

    } catch (error) {
      console.error('SCORM upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setStatus('error');
      
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload SCORM package',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'uploading':
      case 'processing': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading': return 'Uploading SCORM package...';
      case 'processing': return 'Processing SCORM manifest and extracting files...';
      case 'success': return 'SCORM package uploaded and processed successfully!';
      case 'error': return errorMessage;
      default: return 'Ready to upload SCORM 1.2 package';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload SCORM Package</h3>
          <p className="text-sm text-muted-foreground">
            Upload a SCORM 1.2 compliant ZIP file to create a new training course.
          </p>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
            ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary/50'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && document.getElementById('scorm-file-input')?.click()}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-muted-foreground">
              {status === 'success' ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : status === 'error' ? (
                <AlertCircle className="w-12 h-12 text-red-600" />
              ) : (
                <Upload className="w-12 h-12" />
              )}
            </div>
            
            <div>
              <p className={`font-medium ${getStatusColor()}`}>
                {getStatusMessage()}
              </p>
              {status === 'idle' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop your SCORM ZIP file here, or click to select
                </p>
              )}
            </div>

            {(status === 'uploading' || status === 'processing') && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {uploadProgress}% complete
                </p>
              </div>
            )}
          </div>
        </div>

        <input
          id="scorm-file-input"
          type="file"
          accept=".zip"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">SCORM 1.2 Requirements:</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• ZIP file containing imsmanifest.xml</li>
                <li>• SCORM 1.2 compliant content</li>
                <li>• Entry point HTML file specified in manifest</li>
                <li>• Maximum file size: 100MB</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
          {status === 'success' && (
            <Button onClick={() => onUploadComplete('')}>
              Done
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}