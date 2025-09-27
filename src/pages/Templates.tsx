import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { templateService, TestReportTemplate, MaterialEnum } from '@/services/templateService';
import { TemplateForm } from '@/components/TemplateForm';
import { Plus, Search, Edit, Copy, Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

export function Templates() {
  const [templates, setTemplates] = useState<TestReportTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TestReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TestReportTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TestReportTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [templates, searchTerm, materialFilter, statusFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.fetchTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.test_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (materialFilter !== 'all') {
      filtered = filtered.filter(template => template.material === materialFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(template => template.status === statusFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleSaveTemplate = async (templateData: Partial<TestReportTemplate>) => {
    try {
      await templateService.saveTemplate(templateData);
      await fetchTemplates();
      setShowCreateDialog(false);
      setEditingTemplate(null);
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templateService.deleteTemplate(id);
      await fetchTemplates();
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
      console.error('Error deleting template:', error);
    }
  };

  const handleCloneTemplate = async (template: TestReportTemplate) => {
    const newName = prompt('Enter name for cloned template:', `${template.name} (Copy)`);
    if (!newName) return;

    try {
      await templateService.cloneTemplate(template.id, newName);
      await fetchTemplates();
      toast.success('Template cloned successfully');
    } catch (error) {
      toast.error('Failed to clone template');
      console.error('Error cloning template:', error);
    }
  };

  const handleTogglePublish = async (template: TestReportTemplate) => {
    try {
      if (template.status === 'published') {
        await templateService.unpublishTemplate(template.id);
        toast.success('Template unpublished');
      } else {
        await templateService.publishTemplate(template.id);
        toast.success('Template published');
      }
      await fetchTemplates();
    } catch (error) {
      toast.error('Failed to update template status');
      console.error('Error updating template:', error);
    }
  };

  const handleExportTemplate = (template: TestReportTemplate) => {
    const data = {
      name: template.name,
      material: template.material,
      test_type: template.test_type,
      standard: template.standard,
      units: template.units,
      schema_json: template.schema_json,
      rules_json: template.rules_json,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template exported');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Library</h1>
          <p className="text-muted-foreground">
            Manage test report templates for your organization
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              onSave={handleSaveTemplate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={materialFilter} onValueChange={setMaterialFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            <SelectItem value="soil">Soil</SelectItem>
            <SelectItem value="concrete">Concrete</SelectItem>
            <SelectItem value="aggregates">Aggregates</SelectItem>
            <SelectItem value="asphalt">Asphalt</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {templates.length === 0 
              ? "Create your first template to get started"
              : "Try adjusting your search criteria"
            }
          </p>
          {templates.length === 0 && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      v{template.version} • {template.test_type}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{template.material}</Badge>
                    {template.standard && (
                      <Badge variant="outline">{template.standard}</Badge>
                    )}
                    <Badge variant="outline">{template.units}</Badge>
                    <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
                      {template.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {template.schema_json.columns.length} columns
                  </div>

                  <div className="flex justify-between">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloneTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportTemplate(template)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant={template.status === 'published' ? 'secondary' : 'default'}
                      onClick={() => handleTogglePublish(template)}
                    >
                      {template.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => setEditingTemplate(null)}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Material:</span> {previewTemplate.material}</div>
                <div><span className="font-medium">Test Type:</span> {previewTemplate.test_type}</div>
                <div><span className="font-medium">Standard:</span> {previewTemplate.standard || 'None'}</div>
                <div><span className="font-medium">Units:</span> {previewTemplate.units}</div>
                <div><span className="font-medium">Version:</span> v{previewTemplate.version}</div>
                <div><span className="font-medium">Status:</span> {previewTemplate.status}</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Columns ({previewTemplate.schema_json.columns.length})</h4>
                <div className="space-y-1 max-h-32 overflow-auto border rounded p-2">
                  {previewTemplate.schema_json.columns.map((col, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{col.label}</span>
                      <span className="text-muted-foreground">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {previewTemplate.rules_json && (
                <div>
                  <h4 className="font-medium mb-2">Rules</h4>
                  <div className="text-sm space-y-1">
                    {previewTemplate.rules_json.pass_condition && (
                      <div><span className="font-medium">Pass Condition:</span> {previewTemplate.rules_json.pass_condition}</div>
                    )}
                    {previewTemplate.rules_json.remarks && (
                      <div><span className="font-medium">Remarks:</span> {previewTemplate.rules_json.remarks}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}