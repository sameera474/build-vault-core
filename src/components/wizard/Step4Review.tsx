import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Send, FileText, MapPin, Calendar, User } from 'lucide-react';

interface Step4ReviewProps {
  data: any;
  onSaveDraft: () => void;
  onSubmitForApproval: () => void;
  isLoading: boolean;
}

export function Step4Review({ data, onSaveDraft, onSubmitForApproval, isLoading }: Step4ReviewProps) {
  const getComplianceBadge = () => {
    switch (data.compliance_status) {
      case 'PASS':
        return <Badge className="bg-green-100 text-green-800 border-green-200">PASS</Badge>;
      case 'FAIL':
        return <Badge variant="destructive">FAIL</Badge>;
      default:
        return <Badge variant="secondary">PENDING</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not specified';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Final Review</span>
            {getComplianceBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Report Number</p>
                <p className="text-sm text-muted-foreground">{data.report_number || 'Not generated'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{data.road_name || 'Not specified'}</p>
                {data.chainage_from && data.chainage_to && (
                  <p className="text-xs text-muted-foreground">
                    {data.chainage_from} to {data.chainage_to}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Test Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(data.test_date)}</p>
                {data.time_of_test && (
                  <p className="text-xs text-muted-foreground">{data.time_of_test}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Technician</p>
                <p className="text-sm text-muted-foreground">{data.technician_name || 'Not specified'}</p>
                {data.technician_id && (
                  <p className="text-xs text-muted-foreground">ID: {data.technician_id}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Details Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Test Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Test Type:</span>
                  <span>{data.test_type || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span>{data.material || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard:</span>
                  <span>{data.standard || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Side:</span>
                  <span>{data.side || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Site Conditions</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weather:</span>
                  <span>{data.weather_conditions || 'Not specified'}</span>
                </div>
                {data.gps_latitude && data.gps_longitude && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPS:</span>
                    <span className="text-xs">
                      {data.gps_latitude.toFixed(6)}, {data.gps_longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
              {data.site_conditions && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Site Notes:</p>
                  <p className="text-sm bg-muted/50 p-2 rounded text-muted-foreground">
                    {data.site_conditions}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Test Results</h4>
              {data.summary_json && (
                <div className="space-y-1 text-sm">
                  {data.summary_json.field_dry_density && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Field Dry Density:</span>
                      <span>{data.summary_json.field_dry_density.toFixed(3)} g/cm³</span>
                    </div>
                  )}
                  {data.summary_json.degree_of_compaction && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compaction:</span>
                      <span>{data.summary_json.degree_of_compaction.toFixed(1)}%</span>
                    </div>
                  )}
                  {data.summary_json.field_moisture && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Moisture:</span>
                      <span>{data.summary_json.field_moisture.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {getComplianceBadge()}
              <div>
                <p className="font-medium">
                  {data.compliance_status === 'PASS' && 'Test Results Meet Specification'}
                  {data.compliance_status === 'FAIL' && 'Test Results Below Specification'}
                  {data.compliance_status === 'pending' && 'Compliance Analysis Pending'}
                </p>
                {data.summary_json?.degree_of_compaction && data.data_json?.degree_compaction_spec && (
                  <p className="text-sm text-muted-foreground">
                    Achieved: {data.summary_json.degree_of_compaction.toFixed(1)}% | 
                    Required: {data.data_json.degree_compaction_spec}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      {data.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {data.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">Disclaimer</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This test report has been prepared in accordance with the relevant testing standards and procedures. 
            The results shown relate only to the sample(s) tested. This report shall not be reproduced except in full, 
            without written approval of the laboratory. The laboratory assumes no responsibility for the sampling, 
            accuracy of information relating to sample origin, or conditions under which the sample was taken.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </Button>
        
        <Button
          onClick={onSubmitForApproval}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? 'Submitting...' : 'Submit for Approval'}
        </Button>
        
        <Button
          variant="outline"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}