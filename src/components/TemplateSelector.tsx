import React, { useState, useEffect } from 'react';
import { FolderOpen, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Template {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  fields: any;
  calculations?: any;
  charts?: any;
  is_default: boolean;
  created_at: string;
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template | null) => void;
  templateType?: string;
}

const TEMPLATE_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'concrete', label: 'Concrete Testing' },
  { value: 'soil', label: 'Soil Testing' },
  { value: 'steel', label: 'Steel Testing' },
  { value: 'asphalt', label: 'Asphalt Testing' },
  { value: 'general', label: 'General Reports' },
  { value: 'custom', label: 'Custom Templates' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  templateType = 'spreadsheet'
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, profile?.company_id]);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const fetchTemplates = async () => {
    if (!profile?.company_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('template_type', templateType)
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

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(template => 
        template.calculations?.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleCreateBlank = () => {
    onSelectTemplate(null);
    onClose();
  };

  const getCategoryLabel = (category?: string) => {
    const found = TEMPLATE_CATEGORIES.find(cat => cat.value === category);
    return found?.label || 'General';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Template
          </DialogTitle>
          <DialogDescription>
            Choose a template to start with, or create a blank report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Create Blank Option */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors"
                onClick={handleCreateBlank}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <FileText className="h-5 w-5" />
                Create Blank Report
              </CardTitle>
              <CardDescription>
                Start with an empty spreadsheet and build your report from scratch
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Loading templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchQuery || selectedCategory ? 'No templates match your filters' : 'No templates available'}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card key={template.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer border hover:border-gray-400"
                      onClick={() => handleTemplateSelect(template)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium truncate pr-2">
                        {template.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getCategoryLabel(template.calculations?.category)}
                      </Badge>
                    </div>
                    {template.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};