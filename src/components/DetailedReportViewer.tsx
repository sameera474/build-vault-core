import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, User, TestTube, ClipboardList, BarChart3, FileText, Building2, Map } from 'lucide-react';

interface DetailedReportViewerProps {
  report: any;
  project?: any;
  company?: any;
}

export function DetailedReportViewer({ report, project, company }: DetailedReportViewerProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800 border-green-200">PASS</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800 border-red-200">FAIL</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">APPROVED</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">REJECTED</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">PENDING</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">SUBMITTED</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">DRAFT</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to format values properly for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') return value || '-';
    if (Array.isArray(value)) {
      // If array of primitives, join them
      if (value.every(v => typeof v !== 'object')) {
        return value.join(', ');
      }
      // For array of objects, return count
      return `${value.length} items`;
    }
    if (typeof value === 'object') {
      // Try to extract meaningful data from nested objects
      const keys = Object.keys(value);
      if (keys.length === 0) return '-';
      // Show key-value pairs for small objects
      if (keys.length <= 3) {
        return keys.map(k => `${k}: ${formatValue(value[k])}`).join(', ');
      }
      return `${keys.length} fields`;
    }
    return String(value);
  };

  // Format key names for display
  const formatKeyName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderDataTable = (data: any) => {
    if (!data || typeof data !== 'object') return null;
    
    // Handle arrays - render as table
    if (Array.isArray(data)) {
      if (data.length === 0) return <p className="text-muted-foreground">No data available</p>;
      
      // Get all unique headers from all rows
      const headers = [...new Set(data.flatMap(row => Object.keys(row || {})))];
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 text-left text-sm font-medium border-b border-border">
                    {formatKeyName(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  {headers.map((header) => (
                    <td key={header} className="px-3 py-2 text-sm border-b border-border">
                      {formatValue(row?.[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Handle objects - render as key-value pairs
    // Skip the 'kpis' key as it's rendered separately
    const entries = Object.entries(data).filter(([key]) => key !== 'kpis');
    
    if (entries.length === 0) return <p className="text-muted-foreground">No data available</p>;
    
    return (
      <div className="grid gap-2">
        {entries.map(([key, value]) => {
          // If value is an array, render it specially
          if (Array.isArray(value) && value.length > 0) {
            return (
              <div key={key} className="space-y-2">
                <div className="font-medium text-sm">{formatKeyName(key)}:</div>
                {renderDataTable(value)}
              </div>
            );
          }
          
          // If value is a complex object, render it recursively
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const objEntries = Object.entries(value);
            if (objEntries.length > 3) {
              return (
                <div key={key} className="space-y-2">
                  <div className="font-medium text-sm">{formatKeyName(key)}:</div>
                  <div className="pl-4 border-l-2 border-muted">
                    {renderDataTable(value)}
                  </div>
                </div>
              );
            }
          }
          
          return (
            <div key={key} className="flex justify-between items-center p-2 bg-muted/20 rounded">
              <span className="font-medium text-sm">{formatKeyName(key)}:</span>
              <span className="text-right">{formatValue(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderResultsSummary = () => {
    if (!report.results && !report.summary_json && !report.data_json) {
      return <p className="text-muted-foreground">No results data available</p>;
    }

    return (
      <div className="space-y-4">
        {report.summary_json && (
          <div>
            <h4 className="font-medium mb-2">Summary Results</h4>
            {typeof report.summary_json === 'object' && report.summary_json.kpis && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {Object.entries(report.summary_json.kpis).map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-sm text-muted-foreground">{key}</div>
                    <div className="text-lg font-bold">{Number(value as number).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
            {renderDataTable(report.summary_json)}
          </div>
        )}
        
        {report.results && (
          <div>
            <h4 className="font-medium mb-2">Test Results</h4>
            {renderDataTable(report.results)}
          </div>
        )}
        
        {report.data_json && (
          <div>
            <h4 className="font-medium mb-2">Raw Test Data</h4>
            {renderDataTable(report.data_json)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Company/Project Info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4">
            {/* Company Header */}
            {company && (
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-4">
                  {company.client_logo && (
                    <img 
                      src={company.client_logo} 
                      alt="Company Logo" 
                      className="h-12 w-auto"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-bold">{company.name || 'Company Name'}</h1>
                    <p className="text-sm text-muted-foreground">{company.address || company.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Generated: {formatDate(new Date().toISOString())}</p>
                </div>
              </div>
            )}
            
            {/* Report Title */}
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Test Report Details</CardTitle>
                <CardDescription className="text-lg">
                  Report #{report.report_number}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(report.compliance_status)}
                {getStatusBadge(report.status)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step 1: General Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Step 1: General Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Project</div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{project?.name || report.projects?.name || 'N/A'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Test Type</div>
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4 text-muted-foreground" />
                <span>{report.test_type || 'N/A'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Material</div>
              <span>{report.material || report.custom_material || report.material_type || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Standard</div>
              <span>{report.standard || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Test Date</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(report.test_date)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Time of Test</div>
              <span>{formatTime(report.time_of_test)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Location & Site Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Step 2: Location & Site Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Road Name</div>
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground" />
                <span>{report.road_name || 'N/A'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Chainage From</div>
              <span>{report.chainage_from || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Chainage To</div>
              <span>{report.chainage_to || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Covered Chainage</div>
              <span>{report.covered_chainage || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Road Offset</div>
              <span>{report.road_offset || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Side</div>
              <span>{report.side || 'N/A'}</span>
            </div>
            
            {(report.gps_latitude || report.gps_longitude) && (
              <>
                <div className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground">GPS Latitude</div>
                  <span>{report.gps_latitude || 'N/A'}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground">GPS Longitude</div>
                  <span>{report.gps_longitude || 'N/A'}</span>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Weather Conditions</div>
              <span>{report.weather_conditions || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Site Conditions</div>
              <span>{report.site_conditions || 'N/A'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Technician</div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{report.technician_name || 'N/A'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Lab Test No.</div>
              <span>{report.laboratory_test_no || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Test Data & Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Step 3: Test Data & Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderResultsSummary()}
        </CardContent>
      </Card>

      {/* Step 4: Review & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Step 4: Review & Final Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-2">Document Code</div>
              <span>{report.doc_code || 'N/A'}</span>
            </div>
            
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-2">Sequence Number</div>
              <span>{report.seq || 'N/A'}</span>
            </div>
            
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-2">Notes</div>
              <div className="p-3 bg-muted/20 rounded-lg min-h-[60px]">
                {report.notes || 'No additional notes provided.'}
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Created</div>
                <div>{formatDate(report.created_at)}</div>
              </div>
              
              <div>
                <div className="font-medium text-muted-foreground">Last Updated</div>
                <div>{formatDate(report.updated_at)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}