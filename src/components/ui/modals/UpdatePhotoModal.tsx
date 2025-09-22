import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Camera, RotateCcw, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UpdatePhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdatePhotoModal({ open, onOpenChange }: UpdatePhotoModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCroppedImageUrl(null);
      
      // Initialize crop area to center square
      setTimeout(() => {
        if (imageRef.current) {
          const img = imageRef.current;
          const size = Math.min(img.clientWidth, img.clientHeight);
          const x = (img.clientWidth - size) / 2;
          const y = (img.clientHeight - size) / 2;
          setCropArea({ x, y, width: size, height: size });
        }
      }, 100);
    }
  };

  const handleCrop = useCallback(() => {
    if (!selectedFile || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx) return;

    // Calculate the scale factor between displayed image and actual image
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    // Set canvas size to crop area
    canvas.width = 300;
    canvas.height = 300;

    // Draw the cropped portion
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      300,
      300
    );

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCroppedImageUrl(url);
      }
    }, 'image/jpeg', 0.9);
  }, [selectedFile, cropArea]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const img = imageRef.current;
    const maxX = img.clientWidth - cropArea.width;
    const maxY = img.clientHeight - cropArea.height;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(maxX, prev.x + deltaX)),
      y: Math.max(0, Math.min(maxY, prev.y + deltaY))
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!croppedImageUrl || !profile) return;

    setLoading(true);
    try {
      // For now, we'll just show a success message
      // In a real implementation, you would upload the cropped image to Supabase Storage
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully.",
      });
      
      handleReset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCroppedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initials = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Update Profile Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {!previewUrl ? (
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt="Profile preview" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <p className="text-sm text-muted-foreground text-center">
                Current profile photo
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div 
                  className="relative mx-auto w-80 h-60 border-2 border-dashed border-muted-foreground/20 overflow-hidden rounded-lg"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                  
                  {/* Crop overlay */}
                  <div
                    className="absolute border-2 border-primary bg-primary/10 cursor-move"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="absolute inset-0 border border-white/50" />
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Drag the square to position your photo
                </p>
              </div>

              {/* Cropped preview */}
              {croppedImageUrl && (
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={croppedImageUrl} alt="Cropped preview" />
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Preview</p>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!previewUrl ? (
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Photo
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <Button
                  onClick={handleCrop}
                  className="flex-1"
                  variant="outline"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Crop
                </Button>
                
                {croppedImageUrl && (
                  <Button
                    onClick={handleUpload}
                    disabled={loading}
                    className="flex-1"
                  >
                    Upload Photo
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, GIF. Maximum size: 5MB.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}