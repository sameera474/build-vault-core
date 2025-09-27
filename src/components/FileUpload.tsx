import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  bucket: 'documents' | 'avatars';
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  path: string;
}

export function FileUpload({ 
  bucket, 
  accept = "*/*", 
  maxSize = 10,
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !user) return;

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSize}MB limit`,
          variant: "destructive",
        });
        return;
      }

      uploadFile(file);
    });
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    setUploading(true);
    
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL for avatars, signed URL for documents
      let publicUrl;
      if (bucket === 'avatars') {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      } else {
        const { data: urlData, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours
        
        if (urlError) throw urlError;
        publicUrl = urlData.signedUrl;
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        url: publicUrl,
        path: filePath,
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (file: UploadedFile) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([file.path]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(f => f.path !== file.path));
      
      toast({
        title: "File deleted",
        description: `${file.name} has been removed`,
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>
          {bucket === 'avatars' ? 'Profile Picture' : 'Document Upload'}
        </CardTitle>
        <CardDescription>
          {bucket === 'avatars' 
            ? 'Upload your profile picture (public)'
            : `Upload documents (private, max ${maxSize}MB)`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFileSelect(e.dataTransfer.files);
          }}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Drag and drop files here, or{' '}
              <button
                type="button"
                className="text-primary hover:text-primary-hover"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Max file size: {maxSize}MB
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={bucket === 'documents'}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* Loading State */}
        {uploading && (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="ml-2 text-sm text-muted-foreground">Uploading...</span>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFile(file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}