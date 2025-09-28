// Test catalog based on the QAP specifications
export interface TestCode {
  name: string;
  code: string;
  material_type: string;
  description?: string;
}

export const TEST_CATALOG: TestCode[] = [
  // Soil Tests
  { name: "Field Density", code: "FD", material_type: "Soil", description: "Field Density Test using Sand Cone Method" },
  { name: "Atterberg Limits", code: "AL", material_type: "Soil", description: "Liquid and Plastic Limit Tests" },
  { name: "Proctor Compaction", code: "PRO", material_type: "Soil", description: "Standard or Modified Proctor Test" },
  { name: "CBR", code: "CBR", material_type: "Soil", description: "California Bearing Ratio Test" },
  { name: "DCP Field Test", code: "DCP", material_type: "Soil", description: "Dynamic Cone Penetrometer Test" },
  
  // Aggregate Tests
  { name: "Sieve Analysis (Fine/Coarse Aggregates)", code: "AGGSA", material_type: "Aggregates", description: "Particle Size Distribution" },
  { name: "Aggregate Impact Value", code: "AIV", material_type: "Aggregates", description: "Impact Resistance Test" },
  { name: "Shape Index (Flakiness/Elongation)", code: "FI/EI", material_type: "Aggregates", description: "Particle Shape Assessment" },
  { name: "Water Absorption", code: "WA", material_type: "Aggregates", description: "Water Absorption Capacity" },
  { name: "Los Angeles Abrasion Value", code: "LAAV", material_type: "Aggregates", description: "Abrasion Resistance Test" },
  { name: "Bulk Specific Gravity (Fine)", code: "FAGGSG", material_type: "Aggregates", description: "Specific Gravity of Fine Aggregates" },
  { name: "Bulk Specific Gravity (Coarse)", code: "CAGGSG", material_type: "Aggregates", description: "Specific Gravity of Coarse Aggregates" },
  { name: "Clay Silt Dust Fraction", code: "SCDCSD", material_type: "Aggregates", description: "Fine Content in Aggregates" },
  { name: "Aggregate Crushing Value", code: "ACV", material_type: "Aggregates", description: "Crushing Strength Test" },
  { name: "Bulk Density", code: "BD", material_type: "Aggregates", description: "Unit Weight of Aggregates" },
  
  // Concrete Tests
  { name: "Compressive Strength of Concrete", code: "CSC", material_type: "Concrete", description: "Cube/Cylinder Compressive Strength" },
  
  // Asphalt Tests
  { name: "Spread Rate of Binder", code: "SRB", material_type: "Asphalt", description: "Bitumen Application Rate" },
  { name: "Unit Weight/Density of Sand Cone", code: "DSC", material_type: "Asphalt", description: "Density Measurement" },
  { name: "Asphalt Laying Record", code: "ALR", material_type: "Asphalt", description: "Paving Documentation" },
  { name: "Asphalt Core Density & Compaction", code: "ACDC", material_type: "Asphalt", description: "Core Density Analysis" },
  { name: "Quantitative Extraction", code: "QE", material_type: "Asphalt", description: "Binder Content Analysis" },
  { name: "Individual Gradations", code: "IG", material_type: "Asphalt", description: "Gradation Analysis" },
  { name: "Hot Mix Design – Asphalt Wearing Course", code: "MDA", material_type: "Asphalt", description: "Mix Design for Wearing Course" },
];

export class TestCatalogService {
  getTestsByMaterial(materialType: string): TestCode[] {
    return TEST_CATALOG.filter(test => test.material_type === materialType);
  }

  getTestByCode(code: string): TestCode | undefined {
    return TEST_CATALOG.find(test => test.code === code);
  }

  getTestByName(name: string): TestCode | undefined {
    return TEST_CATALOG.find(test => test.name === name);
  }

  getAllTests(): TestCode[] {
    return TEST_CATALOG;
  }

  getMaterialTypes(): string[] {
    return [...new Set(TEST_CATALOG.map(test => test.material_type))];
  }
}

export const testCatalogService = new TestCatalogService();