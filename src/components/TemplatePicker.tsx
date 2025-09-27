import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { templateService, TestReportTemplate, MaterialEnum } from '@/services/templateService';
import { Search, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: TestReportTemplate) => void;
  preselectedMaterial?: MaterialEnum;
  preselectedTestType?: string;
}

export function TemplatePicker({
  open,
  onOpenChange,
  onSelectTemplate,
  preselectedMaterial,
  preselectedTestType
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<TestReportTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TestReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string>(preselectedMaterial || 'all');
  const [testTypeFilter, setTestTypeFilter] = useState<string>(preselectedTestType || 'all');
  const [standardFilter, setStandardFilter] = useState<string>('all');
  const [unitsFilter, setUnitsFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<TestReportTemplate | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [templates, searchTerm, materialFilter, testTypeFilter, standardFilter, unitsFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.fetchTemplates({ status: 'published' });
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.test_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Material filter
    if (materialFilter !== 'all') {
      filtered = filtered.filter(template => template.material === materialFilter);
    }

    // Test type filter
    if (testTypeFilter !== 'all') {
      filtered = filtered.filter(template => template.test_type === testTypeFilter);
    }

    // Standard filter
    if (standardFilter !== 'all') {
      filtered = filtered.filter(template => template.standard === standardFilter);
    }

    // Units filter
    if (unitsFilter !== 'all') {
      filtered = filtered.filter(template => template.units === unitsFilter);
    }

    setFilteredTemplates(filtered);
  };

  const getTestTypes = () => {
    const testTypes = [...new Set(templates.map(t => t.test_type))];
    return testTypes.sort();
  };

  const getStandards = () => {
    const standards = [...new Set(templates.map(t => t.standard).filter(Boolean))];
    return standards.sort();
  };

  const handlePreview = (template: TestReportTemplate) => {
    setPreviewTemplate(template);
  };

  const handleSelect = (template: TestReportTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Template</DialogTitle>
          </DialogHeader>

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

            <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Test Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                {getTestTypes().map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={standardFilter} onValueChange={setStandardFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Standard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Standards</SelectItem>
                {getStandards().map(standard => (
                  <SelectItem key={standard} value={standard}>{standard}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={unitsFilter} onValueChange={setUnitsFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="SI">SI</SelectItem>
                <SelectItem value="Imperial">Imperial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates found matching your criteria
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            v{template.version} • {template.test_type}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {template.material}
                        </Badge>
                        {template.standard && (
                          <Badge variant="outline" className="text-xs">
                            {template.standard}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {template.units}
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => handleSelect(template)}
                        className="w-full"
                        size="sm"
                      >
                        Select Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Material:</span> {previewTemplate.material}
                </div>
                <div>
                  <span className="font-medium">Test Type:</span> {previewTemplate.test_type}
                </div>
                <div>
                  <span className="font-medium">Standard:</span> {previewTemplate.standard || 'None'}
                </div>
                <div>
                  <span className="font-medium">Units:</span> {previewTemplate.units}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Columns ({previewTemplate.schema_json.columns.length})</h4>
                <div className="space-y-1 max-h-32 overflow-auto">
                  {previewTemplate.schema_json.columns.map((col, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{col.label}</span>
                      <span className="text-muted-foreground">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSelect(previewTemplate)}>
                  Select This Template
                </Button>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}