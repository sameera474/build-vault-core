import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Step3SummaryProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function Step3Summary({ data, onUpdate }: Step3SummaryProps) {
  const [summaryData, setSummaryData] = useState(data.summary_json || {});
  const [complianceStatus, setComplianceStatus] = useState('pending');

  useEffect(() => {
    calculateSummary();
  }, [data.data_json]);

  const calculateSummary = () => {
    if (!data.data_json) return;

    const testData = data.data_json;
    const summary: any = {};

    // Calculate key performance indicators based on test type
    if (data.test_type === 'Field Density') {
      // Field Density Test calculations
      summary.max_dry_density = parseFloat(testData.max_dry_density_g_cm3) || 0;
      summary.field_moisture = parseFloat(testData.moisture_content_percent) || 0;
      summary.optimum_moisture = parseFloat(testData.optimum_moisture_percent) || 0;
      summary.field_dry_density = parseFloat(testData.dry_density_g_cm3) || 0;
      
      if (summary.max_dry_density > 0 && summary.field_dry_density > 0) {
        summary.degree_of_compaction = (summary.field_dry_density / summary.max_dry_density) * 100;
      }

      // Determine compliance status
      const requiredCompaction = parseFloat(testData.degree_of_compaction_spec) || 95;
      if (summary.degree_of_compaction >= requiredCompaction) {
        setComplianceStatus('PASS');
      } else if (summary.degree_of_compaction > 0) {
        setComplianceStatus('FAIL');
      } else {
        setComplianceStatus('pending');
      }
    }

    setSummaryData(summary);
    onUpdate({ 
      summary_json: summary,
      compliance_status: complianceStatus
    });
  };

  const getComplianceIcon = () => {
    switch (complianceStatus) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getComplianceBadge = () => {
    switch (complianceStatus) {
      case 'PASS':
        return <Badge className="bg-green-100 text-green-800 border-green-200">PASS</Badge>;
      case 'FAIL':
        return <Badge variant="destructive">FAIL</Badge>;
      default:
        return <Badge variant="secondary">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Results Summary
            <div className="flex items-center gap-2">
              {getComplianceIcon()}
              {getComplianceBadge()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Test Type:</span>
              <p className="text-muted-foreground">{data.test_type || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium">Material:</span>
              <p className="text-muted-foreground">{data.material || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium">Location:</span>
              <p className="text-muted-foreground">{data.road_name || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <p className="text-muted-foreground">{data.test_date || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      {data.test_type === 'Field Density' && (
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Field Dry Density</Label>
                <div className="text-2xl font-bold">
                  {summaryData.field_dry_density ? 
                    `${summaryData.field_dry_density.toFixed(3)} g/cm³` : 
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Measured field density</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Maximum Dry Density</Label>
                <div className="text-2xl font-bold">
                  {summaryData.max_dry_density ? 
                    `${summaryData.max_dry_density.toFixed(3)} g/cm³` : 
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">From Proctor test</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Degree of Compaction</Label>
                <div className="text-2xl font-bold">
                  {summaryData.degree_of_compaction ? 
                    `${summaryData.degree_of_compaction.toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Field / Max density ratio</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Field Moisture Content</Label>
                <div className="text-2xl font-bold">
                  {summaryData.field_moisture ? 
                    `${summaryData.field_moisture.toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Measured moisture</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Optimum Moisture Content</Label>
                <div className="text-2xl font-bold">
                  {summaryData.optimum_moisture ? 
                    `${summaryData.optimum_moisture.toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">From Proctor test</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Specification Requirement</Label>
                <div className="text-2xl font-bold">
                  {data.data_json?.degree_of_compaction_spec ? 
                    `${data.data_json.degree_of_compaction_spec}%` : 
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Required compaction</p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Compliance Analysis */}
            <div className="space-y-4">
              <h4 className="font-semibold">Compliance Analysis</h4>
              <div className="bg-muted/50 p-4 rounded-lg">
                {complianceStatus === 'PASS' && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Test Passed</p>
                      <p className="text-sm text-muted-foreground">
                        The degree of compaction ({summaryData.degree_of_compaction?.toFixed(1)}%) 
                        meets or exceeds the specification requirement of {data.data_json?.degree_compaction_spec}%.
                      </p>
                    </div>
                  </div>
                )}

                {complianceStatus === 'FAIL' && (
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Test Failed</p>
                      <p className="text-sm text-muted-foreground">
                        The degree of compaction ({summaryData.degree_of_compaction?.toFixed(1)}%) 
                        is below the specification requirement of {data.data_json?.degree_compaction_spec}%.
                        Additional compaction may be required.
                      </p>
                    </div>
                  </div>
                )}

                {complianceStatus === 'pending' && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Pending Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Complete all test data entries to determine compliance status.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments and Remarks */}
      <Card>
        <CardHeader>
          <CardTitle>Remarks / Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Enter any additional observations, comments, or recommendations..."
              rows={4}
              className="resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Include any site conditions, observations, or recommendations that may be relevant to the test results.
          </p>
        </CardContent>
      </Card>

      {/* Quick Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Charts and visualizations will be displayed here</p>
            <p className="text-sm">Density trend, moisture content graph, compliance history</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}