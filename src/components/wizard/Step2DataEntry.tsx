import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FieldDensityTest } from './tests/FieldDensityTest';

interface Step2DataEntryProps {
  data: any;
  onUpdate: (data: any) => void;
  testType?: string;
}

export function Step2DataEntry({ data, onUpdate, testType }: Step2DataEntryProps) {
  const [testData, setTestData] = useState(data.data_json || {});

  // Auto-save functionality
  const autoSave = useCallback(() => {
    onUpdate({ data_json: testData });
  }, [testData, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 2000); // Auto-save after 2 seconds of inactivity
    return () => clearTimeout(timer);
  }, [testData, autoSave]);

  const updateTestData = (newData: any) => {
    setTestData(prev => ({ ...prev, ...newData }));
  };

  const renderTestInterface = () => {
    switch (testType) {
      case 'Field Density':
        return (
          <FieldDensityTest
            data={testData}
            onUpdate={updateTestData}
          />
        );
      
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Excel-like Grid Interface</h3>
            <p className="text-muted-foreground mb-4">
              Advanced Excel-like data entry grid for "{testType}" test.
            </p>
            <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <p className="text-muted-foreground">
                Excel-like grid with formulas, validation, copy/paste, undo/redo features will be implemented here.
                <br />
                Features: SUM, AVG, MIN, MAX formulas • Typed columns • Freeze headers • Add/remove rows
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Data Entry</CardTitle>
            <Badge variant="outline">{testType || 'Unknown Test'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Report Number:</span>
              <p className="text-muted-foreground">{data.report_number || 'Not generated'}</p>
            </div>
            <div>
              <span className="font-medium">Road:</span>
              <p className="text-muted-foreground">{data.road_name || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium">Chainage:</span>
              <p className="text-muted-foreground">
                {data.chainage_from && data.chainage_to 
                  ? `${data.chainage_from} to ${data.chainage_to}`
                  : 'Not specified'
                }
              </p>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <p className="text-muted-foreground">{data.test_date || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Test Interface */}
      {renderTestInterface()}

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Enter test data in the fields above</li>
            <li>• Data is automatically saved every 2 seconds</li>
            <li>• Use Tab to navigate between fields quickly</li>
            <li>• Required calculations are performed automatically</li>
            <li>• Red fields indicate validation errors</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}