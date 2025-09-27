import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Download, Trash2, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  uploadedAt: string;
  url: string;
  path: string;
}

interface FileManagerProps {
  onFileUploaded?: (file: FileItem) => void;
}

const FILE_CATEGORIES = [
  { value: 'certificates', label: 'Certificates' },
  { value: 'test-results', label: 'Test Results' },
  { value: 'specifications', label: 'Specifications' },
  { value: 'photos', label: 'Site Photos' },
  { value: 'reports', label: 'Reports' },
  { value: 'other', label: 'Other' },
];

export function FileManager({ onFileUploaded }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.company_id) return;

    setUploading(true);
    try {
      // Create file path with company organization
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${profile.company_id}/documents/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const newFile: FileItem = {
        id: fileName,
        name: file.name,
        size: file.size,
        type: file.type,
        category: 'other',
        uploadedAt: new Date().toISOString(),
        url: publicUrl,
        path: filePath,
      };

      setFiles(prev => [newFile, ...prev]);
      onFileUploaded?.(newFile);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([file.path]);

      if (error) throw error;

      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (file: FileItem) => {
    window.open(file.url, '_blank');
  };

  const updateFileCategory = (fileId: string, category: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, category } : file
      )
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📁';
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            Upload certificates, test results, and other documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Choose File</Label>
              <Input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: PDF, Word, Excel, Images (Max 10MB)
              </p>
            </div>
            {uploading && (
              <div className="text-sm text-muted-foreground">
                Uploading file...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Library</CardTitle>
          <CardDescription>
            Manage your uploaded documents and files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {FILE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File List */}
            <div className="space-y-2">
              {filteredFiles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
                </p>
              ) : (
                filteredFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{getFileIcon(file.type)}</span>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select 
                        value={file.category} 
                        onValueChange={(value) => updateFileCategory(file.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FILE_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}