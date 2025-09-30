import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/projectService';
import { testCatalogService } from '@/services/testCatalogService';
import { useReportNumber } from '@/hooks/useReportNumber';
import { toast } from '@/hooks/use-toast';

// Material options with enum-safe values
const MATERIAL_OPTIONS = [
  { label: 'Soil', value: 'soil' },
  { label: 'Aggregate', value: 'aggregate' },
  { label: 'Concrete', value: 'concrete' },
  { label: 'Asphalt', value: 'asphalt' },
  { label: 'Steel', value: 'steel' },
  { label: 'Custom', value: 'custom' },
];

// Mapping from enum values to catalog material types
const ENUM_TO_CATALOG_MATERIAL: { [key: string]: string } = {
  'soil': 'Soil',
  'aggregate': 'Aggregates',
  'concrete': 'Concrete',
  'asphalt': 'Asphalt',
  'steel': 'Steel',
};

interface Step1GeneralProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function Step1General({ data, onUpdate }: Step1GeneralProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectRoads, setProjectRoads] = useState<any[]>([]);
  const [filteredTests, setFilteredTests] = useState<any[]>([]);
  const [newRoadName, setNewRoadName] = useState('');
  const [showAddRoad, setShowAddRoad] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Use the report number hook
  const { reportNumber, isLoading: isGeneratingNumber } = useReportNumber(
    data.project_id,
    data.doc_code,
    data.test_date ? new Date(data.test_date) : undefined
  );

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (data.project_id) {
      loadProjectRoads(data.project_id);
    }
  }, [data.project_id]);

  useEffect(() => {
    if (data.material && data.material !== 'custom') {
      const catalogMaterialType = ENUM_TO_CATALOG_MATERIAL[data.material];
      if (catalogMaterialType) {
        const filtered = testCatalogService.getTestsByMaterial(catalogMaterialType);
        setFilteredTests(filtered);
      } else {
        setFilteredTests([]);
      }
    } else {
      setFilteredTests([]);
    }
  }, [data.material]);

  useEffect(() => {
    if (reportNumber && reportNumber !== data.report_number) {
      onUpdate({ report_number: reportNumber });
    }
  }, [reportNumber, data.report_number, onUpdate]);

  const loadProjects = async () => {
    try {
      const projectData = await projectService.fetchProjects();
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProjectRoads = async (projectId: string) => {
    try {
      const roads = await projectService.fetchProjectRoads(projectId);
      setProjectRoads(roads);
    } catch (error) {
      console.error('Error loading project roads:', error);
    }
  };


  const handleAddRoad = async () => {
    if (!newRoadName.trim() || !data.project_id) return;

    try {
      await projectService.createProjectRoad({
        project_id: data.project_id,
        name: newRoadName.trim()
      });
      
      setNewRoadName('');
      setShowAddRoad(false);
      loadProjectRoads(data.project_id);
      
      toast({
        title: 'Road Added',
        description: `"${newRoadName}" has been added to the project.`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add road. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive'
      });
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onUpdate({
          gps_latitude: position.coords.latitude,
          gps_longitude: position.coords.longitude
        });
        setIsDetectingLocation(false);
        toast({
          title: 'Location Detected',
          description: 'GPS coordinates have been captured successfully.'
        });
      },
      (error) => {
        setIsDetectingLocation(false);
        toast({
          title: 'Location Error',
          description: 'Failed to detect location. Please enter coordinates manually.',
          variant: 'destructive'
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleTestTypeChange = (testType: string) => {
    const selectedTest = testCatalogService.getTestByName(testType);
    onUpdate({
      test_type: testType,
      doc_code: selectedTest?.code || ''
    });
  };

  const validateChainage = (value: string) => {
    const chainagePattern = /^\d+\+\d{3}$/;
    return chainagePattern.test(value);
  };

  const handleChainageChange = (field: string, value: string) => {
    // Allow typing freely, validation happens on blur
    onUpdate({ [field]: value });
  };

  const handleChainageBlur = (field: string, value: string) => {
    // Only validate when user finishes typing
    if (value && !validateChainage(value)) {
      toast({
        title: 'Invalid Format',
        description: 'Chainage must be in format: KM+meters (e.g., 5+250)',
        variant: 'destructive'
      });
      return;
    }

    if (field === 'chainage_to' && data.chainage_from && value) {
      const fromKm = parseFloat(data.chainage_from.split('+')[0]);
      const fromM = parseFloat(data.chainage_from.split('+')[1]);
      const toKm = parseFloat(value.split('+')[0]);
      const toM = parseFloat(value.split('+')[1]);
      
      if (isNaN(fromKm) || isNaN(fromM) || isNaN(toKm) || isNaN(toM)) {
        return;
      }
      
      const fromTotal = fromKm * 1000 + fromM;
      const toTotal = toKm * 1000 + toM;
      
      if (toTotal < fromTotal) {
        toast({
          title: 'Invalid Range',
          description: 'Chainage To must be greater than or equal to Chainage From.',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Selection */}
        <div className="space-y-2">
          <Label htmlFor="project">Project *</Label>
          <Select
            value={data.project_id || ''}
            onValueChange={(value) => onUpdate({ project_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto Report Number */}
        <div className="space-y-2">
          <Label htmlFor="report_number">Report Number</Label>
          <Input
            value={data.report_number || ''}
            readOnly
            placeholder={isGeneratingNumber ? 'Generating...' : 'Select project and test details first'}
            className="bg-muted"
          />
        </div>
      </div>

      {/* Location Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isDetectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GPS Latitude</Label>
              <Input
                type="number"
                step="any"
                value={data.gps_latitude || ''}
                onChange={(e) => onUpdate({ gps_latitude: parseFloat(e.target.value) || undefined })}
                placeholder="e.g., 7.8731"
              />
            </div>
            <div className="space-y-2">
              <Label>GPS Longitude</Label>
              <Input
                type="number"
                step="any"
                value={data.gps_longitude || ''}
                onChange={(e) => onUpdate({ gps_longitude: parseFloat(e.target.value) || undefined })}
                placeholder="e.g., 80.7718"
              />
            </div>
          </div>

          {/* Road Name */}
          <div className="space-y-2">
            <Label htmlFor="road_name">Road Name *</Label>
            <div className="flex gap-2">
              <Select
                value={data.road_name || ''}
                onValueChange={(value) => onUpdate({ road_name: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select road..." />
                </SelectTrigger>
                <SelectContent>
                  {projectRoads.map((road) => (
                    <SelectItem key={road.id} value={road.name}>
                      {road.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowAddRoad(!showAddRoad)}
                disabled={!data.project_id}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showAddRoad && (
              <div className="flex gap-2">
                <Input
                  value={newRoadName}
                  onChange={(e) => setNewRoadName(e.target.value)}
                  placeholder="Enter new road name..."
                />
                <Button onClick={handleAddRoad}>Add</Button>
                <Button variant="outline" onClick={() => setShowAddRoad(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Information */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Material *</Label>
              <Select
                value={data.material || ''}
                onValueChange={(value) => onUpdate({ material: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material..." />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {data.material === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Material</Label>
                <Input
                  value={data.custom_material || ''}
                  onChange={(e) => onUpdate({ custom_material: e.target.value })}
                  placeholder="Enter custom material type..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Select Test *</Label>
              <Select
                value={data.test_type || ''}
                onValueChange={handleTestTypeChange}
                disabled={!data.material || data.material === 'custom'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTests.map((test) => (
                    <SelectItem key={test.id} value={test.name}>
                      {test.name} ({test.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chainage and Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chainage Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chainage From * (KM+meters)</Label>
              <Input
                value={data.chainage_from || ''}
                onChange={(e) => handleChainageChange('chainage_from', e.target.value)}
                onBlur={(e) => handleChainageBlur('chainage_from', e.target.value)}
                placeholder="e.g., 5+250"
              />
              <p className="text-xs text-muted-foreground">Format: KM+meters (e.g., 5+250)</p>
            </div>
            <div className="space-y-2">
              <Label>Chainage To * (KM+meters)</Label>
              <Input
                value={data.chainage_to || ''}
                onChange={(e) => handleChainageChange('chainage_to', e.target.value)}
                onBlur={(e) => handleChainageBlur('chainage_to', e.target.value)}
                placeholder="e.g., 5+300"
              />
            </div>
            <div className="space-y-2">
              <Label>Side of Road *</Label>
              <Select
                value={data.side || ''}
                onValueChange={(value) => onUpdate({ side: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select side..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Test Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date of Test *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.test_date && "text-muted-foreground"
                    )}
                  >
                    {data.test_date ? format(new Date(data.test_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.test_date ? new Date(data.test_date) : undefined}
                    onSelect={(date) => onUpdate({ test_date: date?.toISOString().split('T')[0] })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time of Test</Label>
              <Input
                type="time"
                value={data.time_of_test || ''}
                onChange={(e) => onUpdate({ time_of_test: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personnel and Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personnel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Technician Name *</Label>
              <Input
                value={data.technician_name || ''}
                onChange={(e) => onUpdate({ technician_name: e.target.value })}
                placeholder="Enter technician name..."
              />
            </div>
            <div className="space-y-2">
              <Label>Technician ID</Label>
              <Input
                value={data.technician_id || ''}
                onChange={(e) => onUpdate({ technician_id: e.target.value })}
                placeholder="Enter employee number..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Site Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Weather Conditions</Label>
              <Select
                value={data.weather_conditions || ''}
                onValueChange={(value) => onUpdate({ weather_conditions: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weather..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunny">Sunny</SelectItem>
                  <SelectItem value="Cloudy">Cloudy</SelectItem>
                  <SelectItem value="Rainy">Rainy</SelectItem>
                  <SelectItem value="Windy">Windy</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site Conditions</Label>
              <Textarea
                value={data.site_conditions || ''}
                onChange={(e) => onUpdate({ site_conditions: e.target.value })}
                placeholder="Describe site conditions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}