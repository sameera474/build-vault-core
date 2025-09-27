import { useState, useEffect } from 'react';
import { FileManager } from '@/components/FileManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, FileText, Camera, Award, TrendingUp } from 'lucide-react';

interface DocumentStats {
  total: number;
  categories: Record<string, number>;
  recentUploads: number;
}

export default function Documents() {
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    categories: {},
    recentUploads: 0,
  });

  const updateStats = (file: any) => {
    setStats(prev => ({
      total: prev.total + 1,
      categories: {
        ...prev.categories,
        [file.category]: (prev.categories[file.category] || 0) + 1,
      },
      recentUploads: prev.recentUploads + 1,
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'certificates':
        return <Award className="h-4 w-4" />;
      case 'photos':
        return <Camera className="h-4 w-4" />;
      case 'reports':
        return <FileText className="h-4 w-4" />;
      default:
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  const categoryLabels: Record<string, string> = {
    certificates: 'Certificates',
    'test-results': 'Test Results',
    specifications: 'Specifications',
    photos: 'Site Photos',
    reports: 'Reports',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Document Management</h1>
        <p className="text-muted-foreground">Upload and organize your construction testing documents</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(stats.categories).length}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Uploads</p>
                <p className="text-2xl font-bold">{stats.recentUploads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold">{stats.categories.certificates || 0}</p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="manager" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manager">File Manager</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="manager">
          <FileManager onFileUploaded={updateStats} />
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>File Categories</CardTitle>
              <CardDescription>Overview of files organized by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.categories).map(([category, count]) => (
                  <Card key={category}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <div>
                            <p className="font-medium">{categoryLabels[category] || category}</p>
                            <p className="text-sm text-muted-foreground">{count} files</p>
                          </div>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {Object.keys(stats.categories).length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No files uploaded yet. Start by uploading your first document.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}