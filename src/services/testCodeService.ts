import { supabase } from '@/integrations/supabase/client';

export interface TestDocCode {
  id: string;
  code: string;
  name: string;
  material_type: string;
  description?: string;
  created_at: string;
}

export const MATERIAL_TYPES = [
  'Soil',
  'Aggregates', 
  'Concrete',
  'Asphalt',
  'Steel',
  'Custom'
] as const;

export type MaterialType = typeof MATERIAL_TYPES[number];

class TestCodeService {
  async fetchTestCodes(): Promise<TestDocCode[]> {
    const { data, error } = await supabase
      .from('test_doc_codes')
      .select('*')
      .order('material_type', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as TestDocCode[];
  }

  async fetchTestCodesByMaterial(materialType: string): Promise<TestDocCode[]> {
    const { data, error } = await supabase
      .from('test_doc_codes')
      .select('*')
      .eq('material_type', materialType)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as TestDocCode[];
  }

  async fetchTestCode(code: string): Promise<TestDocCode | null> {
    const { data, error } = await supabase
      .from('test_doc_codes')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) return null;
    return data as TestDocCode;
  }
}

export const testCodeService = new TestCodeService();