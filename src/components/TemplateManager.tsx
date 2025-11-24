import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Copy, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Template {
  id: string;
  name: string;
  description: string;
  template_type: string;
  fields: any;
  calculations: any;
  charts: any;
  is_default: boolean;
  created_at: string;
}

interface TemplateManagerProps {
  onSelectTemplate?: (template: Template) => void;
  mode?: 'select' | 'manage';
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ onSelectTemplate, mode = 'manage' }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'test_report',
    fields: '{}',
    calculations: '{}',
    charts: '{}'
  });

  useEffect(() => {
    fetchTemplates();
  }, [profile?.company_id]);

  const fetchTemplates = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .or(`company_id.eq.${profile.company_id},is_default.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!profile?.company_id) return;

    try {
      let fields, calculations, charts;
      
      try {
        fields = JSON.parse(formData.fields);
        calculations = JSON.parse(formData.calculations);
        charts = JSON.parse(formData.charts);
      } catch (e) {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON formatting in fields, calculations, or charts",
          variant: "destructive",
        });
        return;
      }

      const templateData = {
        name: formData.name,
        description: formData.description,
        template_type: formData.template_type,
        fields,
        calculations,
        charts,
        company_id: profile.company_id,
        created_by: profile.user_id,
      };

      let error;
      if (editingTemplate) {
        ({ error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', editingTemplate.id));
      } else {
        ({ error } = await supabase
          .from('templates')
          .insert([templateData]));
      }

      if (error) throw error;

      toast({
        title: editingTemplate ? "Template updated" : "Template created",
        description: `Template "${formData.name}" has been ${editingTemplate ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    setDeleteTemplateId(templateId);
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTemplateId) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', deleteTemplateId);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: "Template has been removed successfully.",
      });

      setDeleteTemplateId(null);
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const duplicateTemplate = async (template: Template) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('templates')
        .insert([{
          name: `${template.name} (Copy)`,
          description: template.description,
          template_type: template.template_type,
          fields: template.fields,
          calculations: template.calculations,
          charts: template.charts,
          company_id: profile.company_id,
          created_by: profile.user_id,
        }]);

      if (error) throw error;

      toast({
        title: "Template duplicated",
        description: "Template has been duplicated successfully.",
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_type: 'test_report',
      fields: '{}',
      calculations: '{}',
      charts: '{}'
    });
    setEditingTemplate(null);
    setIsCreateOpen(false);
  };

  const openEditDialog = (template: Template) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      fields: JSON.stringify(template.fields, null, 2),
      calculations: JSON.stringify(template.calculations, null, 2),
      charts: JSON.stringify(template.charts, null, 2)
    });
    setEditingTemplate(template);
    setIsCreateOpen(true);
  };

  const exportTemplate = (template: Template) => {
    const templateData = {
      name: template.name,
      description: template.description,
      template_type: template.template_type,
      fields: template.fields,
      calculations: template.calculations,
      charts: template.charts
    };

    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${template.name.replace(/\s+/g, '_')}_template.json`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getDefaultTemplateExamples = () => {
    return {
      concrete_compression: {
        name: "Concrete Compression Test",
        description: "Standard concrete compression test with automatic calculations",
        fields: {
          "specimen_id": { type: "text", label: "Specimen ID", required: true },
          "test_date": { type: "date", label: "Test Date", required: true },
          "cross_sectional_area": { type: "number", label: "Cross Sectional Area (mm²)", required: true },
          "load_at_failure": { type: "number", label: "Load at Failure (kN)", required: true },
          "age_at_test": { type: "number", label: "Age at Test (days)", required: true }
        },
        calculations: {
          "compressive_strength": "load_at_failure * 1000 / cross_sectional_area",
          "strength_grade": "compressive_strength >= 20 ? 'PASS' : 'FAIL'"
        },
        charts: {
          "strength_chart": {
            type: "bar",
            title: "Compressive Strength Results",
            x_axis: "specimen_id",
            y_axis: "compressive_strength"
          }
        }
      },
      steel_tensile: {
        name: "Steel Tensile Test",
        description: "Steel tensile strength test with stress-strain analysis",
        fields: {
          "specimen_id": { type: "text", label: "Specimen ID", required: true },
          "test_date": { type: "date", label: "Test Date", required: true },
          "original_area": { type: "number", label: "Original Area (mm²)", required: true },
          "gauge_length": { type: "number", label: "Gauge Length (mm)", required: true },
          "ultimate_load": { type: "number", label: "Ultimate Load (kN)", required: true },
          "yield_load": { type: "number", label: "Yield Load (kN)", required: true }
        },
        calculations: {
          "tensile_strength": "ultimate_load * 1000 / original_area",
          "yield_strength": "yield_load * 1000 / original_area",
          "elongation": "(final_length - gauge_length) / gauge_length * 100"
        },
        charts: {
          "stress_strain": {
            type: "line",
            title: "Stress-Strain Curve",
            x_axis: "strain",
            y_axis: "stress"
          }
        }
      }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mode === 'manage' && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Template Manager</h2>
            <p className="text-muted-foreground">
              Create and manage customizable test report templates
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTemplate(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </DialogTitle>
                <DialogDescription>
                  Define fields, calculations, and charts for your test report template
                </DialogDescription>
              </DialogHeader>
              <TemplateForm
                formData={formData}
                setFormData={setFormData}
                onSave={saveTemplate}
                onCancel={resetForm}
                isEditing={!!editingTemplate}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  {template.is_default && (
                    <Badge variant="secondary" className="ml-2">Default</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p><strong>Type:</strong> {template.template_type.replace('_', ' ')}</p>
                <p><strong>Fields:</strong> {Object.keys(template.fields || {}).length}</p>
                <p><strong>Calculations:</strong> {Object.keys(template.calculations || {}).length}</p>
                <p><strong>Charts:</strong> {Object.keys(template.charts || {}).length}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {mode === 'select' ? (
                  <Button 
                    onClick={() => onSelectTemplate?.(template)}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                ) : (
                  <>
                    {!template.is_default && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTemplate(template)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to get started with customizable test reports
          </p>
          {mode === 'manage' && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTemplateId}
        onOpenChange={(open) => !open && setDeleteTemplateId(null)}
        onConfirm={confirmDeleteTemplate}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

const TemplateForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}> = ({ formData, setFormData, onSave, onCancel, isEditing }) => {
  const examples = {
    fields: `{
  "specimen_id": {
    "type": "text",
    "label": "Specimen ID",
    "required": true
  },
  "test_date": {
    "type": "date", 
    "label": "Test Date",
    "required": true
  },
  "compressive_strength": {
    "type": "number",
    "label": "Compressive Strength (MPa)",
    "required": true
  }
}`,
    calculations: `{
  "strength_ratio": "compressive_strength / 25",
  "grade": "compressive_strength >= 20 ? 'PASS' : 'FAIL'",
  "average_strength": "AVERAGE(compressive_strength)"
}`,
    charts: `{
  "strength_chart": {
    "type": "bar",
    "title": "Compressive Strength Results",
    "x_axis": "specimen_id",
    "y_axis": "compressive_strength"
  }
}`
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Concrete Compression Test"
            required
          />
        </div>
        <div>
          <Label htmlFor="template_type">Template Type</Label>
          <Select value={formData.template_type} onValueChange={(value) => setFormData({...formData, template_type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test_report">Test Report</SelectItem>
              <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
              <SelectItem value="project_report">Project Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Template description..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="fields">Fields Configuration (JSON)</Label>
        <Textarea
          id="fields"
          value={formData.fields}
          onChange={(e) => setFormData({...formData, fields: e.target.value})}
          placeholder={examples.fields}
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label htmlFor="calculations">Calculations (JSON)</Label>
        <Textarea
          id="calculations"
          value={formData.calculations}
          onChange={(e) => setFormData({...formData, calculations: e.target.value})}
          placeholder={examples.calculations}
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label htmlFor="charts">Charts Configuration (JSON)</Label>
        <Textarea
          id="charts"
          value={formData.charts}
          onChange={(e) => setFormData({...formData, charts: e.target.value})}
          placeholder={examples.charts}
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
};