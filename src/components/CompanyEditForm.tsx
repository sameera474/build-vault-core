import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  is_active: boolean;
}

interface CompanyEditFormProps {
  company: Company;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CompanyEditForm({ company, onSuccess, onCancel }: CompanyEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name || '',
    description: company.description || '',
    website: company.website || '',
    phone: company.phone || '',
    address: company.address || '',
    city: company.city || '',
    country: company.country || '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          description: formData.description || null,
          website: formData.website || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            disabled={loading}
            placeholder="https://example.com"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={loading}
            placeholder="+27 XX XXX XXXX"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Company'}
        </Button>
      </div>
    </form>
  );
}