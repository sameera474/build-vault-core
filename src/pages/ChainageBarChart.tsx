import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, MapPin, Settings, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
}

interface ChainagePoint {
  id: string;
  project_id: string;
  chainage: number;
  description: string;
  test_type: string;
  test_value: number;
  compliance_status: string;
  test_date: string;
  specification_min?: number;
  specification_max?: number;
  created_at: string;
}

interface ChartData {
  chainage: number;
  value: number;
  status: string;
  description: string;
  testDate: string;
  specMin?: number;
  specMax?: number;
}

const testTypeConfigs = {
  'Concrete Compression': { 
    unit: 'MPa', 
    minValue: 20, 
    maxValue: 50,
    color: '#3b82f6'
  },
  'Steel Tensile': { 
    unit: 'MPa', 
    minValue: 400, 
    maxValue: 600,
    color: '#6366f1'
  },
  'Soil Compaction': { 
    unit: '%', 
    minValue: 90, 
    maxValue: 100,
    color: '#8b5cf6'
  },
  'CBR Test': { 
    unit: '%', 
    minValue: 5, 
    maxValue: 15,
    color: '#84cc16'
  },
  'Asphalt Marshall': { 
    unit: 'kN', 
    minValue: 8, 
    maxValue: 16,
    color: '#f59e0b'
  },
  'Default': { 
    unit: '', 
    minValue: 0, 
    maxValue: 100,
    color: '#6b7280'
  }
};

export default function ChainageBarChart() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chainageData, setChainageData] = useState<ChainagePoint[]>([]);
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const [availableTestTypes, setAvailableTestTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPointOpen, setIsAddPointOpen] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [newPoint, setNewPoint] = useState({
    chainage: '',
    description: '',
    test_type: '',
    test_value: '',
    compliance_status: 'pending',
    test_date: new Date().toISOString().split('T')[0],
    specification_min: '',
    specification_max: ''
  });

  useEffect(() => {
    fetchProjects();
    // Only fetch if projectId is a valid UUID (not undefined, not ":projectId")
    if (projectId && projectId !== ':projectId' && !projectId.includes(':')) {
      fetchProjectData(projectId);
      fetchChainageData(projectId);
    }
  }, [projectId, profile?.company_id]);

  const fetchProjects = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, location')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProjectData = async (id: string) => {
    if (!profile?.company_id || !id || id.includes(':')) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, location')
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    }
  };

  const fetchChainageData = async (id: string) => {
    if (!profile?.company_id || !id || id.includes(':')) return;

    try {
      const { data, error } = await supabase
        .from('chainage_points')
        .select('*')
        .eq('project_id', id)
        .eq('company_id', profile.company_id)
        .order('chainage');

      if (error) throw error;

      const chainagePoints: ChainagePoint[] = data?.map((point) => ({
        id: point.id,
        project_id: point.project_id || id,
        chainage: Number(point.chainage),
        description: point.description || '',
        test_type: point.test_type,
        test_value: Number(point.test_value),
        compliance_status: point.compliance_status,
        test_date: point.test_date,
        specification_min: point.specification_min ? Number(point.specification_min) : undefined,
        specification_max: point.specification_max ? Number(point.specification_max) : undefined,
        created_at: point.created_at
      })) || [];

      setChainageData(chainagePoints);
      
      const testTypes = Array.from(new Set(chainagePoints.map(p => p.test_type)));
      setAvailableTestTypes(testTypes);
    } catch (error) {
      console.error('Error fetching chainage data:', error);
      toast({
        title: "Error",
        description: "Failed to load chainage data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTestValue = (testType: string): number => {
    const config = testTypeConfigs[testType as keyof typeof testTypeConfigs] || testTypeConfigs.Default;
    return Math.random() * (config.maxValue - config.minValue) + config.minValue;
  };

  const getSpecMin = (testType: string): number => {
    const config = testTypeConfigs[testType as keyof typeof testTypeConfigs] || testTypeConfigs.Default;
    return config.minValue;
  };

  const getSpecMax = (testType: string): number => {
    const config = testTypeConfigs[testType as keyof typeof testTypeConfigs] || testTypeConfigs.Default;
    return config.maxValue;
  };

  const getFilteredData = (): ChartData[] => {
    let filtered = chainageData;
    
    if (selectedTestType !== 'all') {
      filtered = filtered.filter(point => point.test_type === selectedTestType);
    }

    return filtered
      .sort((a, b) => a.chainage - b.chainage)
      .map(point => ({
        chainage: point.chainage,
        value: point.test_value,
        status: point.compliance_status,
        description: point.description,
        testDate: point.test_date,
        specMin: point.specification_min,
        specMax: point.specification_max
      }));
  };

  const getTestTypeConfig = () => {
    if (selectedTestType === 'all') return testTypeConfigs.Default;
    return testTypeConfigs[selectedTestType as keyof typeof testTypeConfigs] || testTypeConfigs.Default;
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'pass': return '#22c55e';
      case 'fail': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'review_required': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const addChainagePoint = async () => {
    if (!projectId || !profile?.company_id) return;

    // Validate required fields
    if (!newPoint.chainage || !newPoint.test_type || !newPoint.test_value) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Chainage, Test Type, Test Value)",
        variant: "destructive",
      });
      return;
    }

    try {
      const config = testTypeConfigs[newPoint.test_type as keyof typeof testTypeConfigs] || testTypeConfigs.Default;
      
      const { error } = await supabase
        .from('chainage_points')
        .insert({
          project_id: projectId,
          company_id: profile.company_id,
          chainage: parseFloat(newPoint.chainage),
          test_type: newPoint.test_type,
          test_value: parseFloat(newPoint.test_value),
          test_date: newPoint.test_date,
          description: newPoint.description || `Test point at ${newPoint.chainage}m`,
          compliance_status: newPoint.compliance_status,
          specification_min: newPoint.specification_min ? parseFloat(newPoint.specification_min) : config.minValue,
          specification_max: newPoint.specification_max ? parseFloat(newPoint.specification_max) : config.maxValue,
          created_by: profile.user_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chainage point has been added successfully.",
      });

      setNewPoint({
        chainage: '',
        description: '',
        test_type: '',
        test_value: '',
        compliance_status: 'pending',
        test_date: new Date().toISOString().split('T')[0],
        specification_min: '',
        specification_max: ''
      });
      setIsAddPointOpen(false);
      
      // Refresh data
      fetchChainageData(projectId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add chainage point",
        variant: "destructive",
      });
    }
  };

  const exportChartData = () => {
    const data = getFilteredData();
    const config = getTestTypeConfig();
    
    const csvContent = [
      ['Chainage (m)', `Test Value (${config.unit})`, 'Status', 'Description', 'Test Date'],
      ...data.map(point => [
        point.chainage,
        point.value.toFixed(2),
        point.status,
        point.description,
        point.testDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `chainage-data-${project?.name || 'project'}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!projectId || projectId === ':projectId' || projectId.includes(':')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chainage Bar Charts</h1>
          <p className="text-muted-foreground">
            Select a project to view test results along chainages
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
            <CardDescription>Choose a project to analyze chainage data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => (
                <Card key={proj.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{proj.name}</CardTitle>
                    <CardDescription>{proj.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      {proj.location}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/barchart/${proj.id}`)}
                    >
                      View Chainage Chart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No projects found. Create a project first to view chainage charts.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = getFilteredData();
  const config = getTestTypeConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chainage Bar Chart</h1>
          <p className="text-muted-foreground">
            {project?.name} - Test results along project chainage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTestType} onValueChange={setSelectedTestType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Test Types</SelectItem>
              {availableTestTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isAddPointOpen} onOpenChange={setIsAddPointOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Point
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Chainage Point</DialogTitle>
                <DialogDescription>
                  Add a new test point along the project chainage
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chainage">Chainage (m)</Label>
                    <Input
                      id="chainage"
                      type="number"
                      value={newPoint.chainage}
                      onChange={(e) => setNewPoint(prev => ({...prev, chainage: e.target.value}))}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="test_date">Test Date</Label>
                    <Input
                      id="test_date"
                      type="date"
                      value={newPoint.test_date}
                      onChange={(e) => setNewPoint(prev => ({...prev, test_date: e.target.value}))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="test_type">Test Type</Label>
                  <Select value={newPoint.test_type} onValueChange={(value) => setNewPoint(prev => ({...prev, test_type: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(testTypeConfigs).filter(key => key !== 'Default').map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test_value">Test Value</Label>
                  <Input
                    id="test_value"
                    type="number"
                    step="0.1"
                    value={newPoint.test_value}
                    onChange={(e) => setNewPoint(prev => ({...prev, test_value: e.target.value}))}
                    placeholder="25.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newPoint.description}
                    onChange={(e) => setNewPoint(prev => ({...prev, description: e.target.value}))}
                    placeholder="Test point description"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddPointOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addChainagePoint}>
                    Add Point
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={exportChartData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {project?.name}
          </CardTitle>
          <CardDescription>
            {project?.description} • {project?.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-medium">Total Points:</span> {chartData.length}
            </div>
            <div>
              <span className="font-medium">Test Type:</span> {selectedTestType === 'all' ? 'All Types' : selectedTestType}
            </div>
            <div>
              <span className="font-medium">Unit:</span> {config.unit}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test Results by Chainage
          </CardTitle>
          <CardDescription>
            {selectedTestType === 'all' ? 'All test types' : selectedTestType} along project chainage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="chainage" 
                    label={{ value: 'Chainage (m)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: `Test Value (${config.unit})`, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(2)} ${config.unit}`, 
                      'Test Value'
                    ]}
                    labelFormatter={(label) => `Chainage: ${label}m`}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-md">
                            <p className="font-medium">{`Chainage: ${label}m`}</p>
                            <p className="text-sm">{`Value: ${payload[0].value?.toFixed(2)} ${config.unit}`}</p>
                            <p className="text-sm">{`Status: ${data.status}`}</p>
                            <p className="text-sm">{`Date: ${new Date(data.testDate).toLocaleDateString()}`}</p>
                            <p className="text-sm">{data.description}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={config.color}
                    name="Test Value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                  {/* Specification lines */}
                  {chartData[0]?.specMin && (
                    <ReferenceLine 
                      y={chartData[0].specMin} 
                      stroke="red" 
                      strokeDasharray="5 5"
                      label="Min Spec"
                    />
                  )}
                  {chartData[0]?.specMax && (
                    <ReferenceLine 
                      y={chartData[0].specMax} 
                      stroke="green" 
                      strokeDasharray="5 5"
                      label="Max Spec"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No chainage data found</h3>
              <p className="text-muted-foreground mb-4">
                No test points available for the selected filters.
              </p>
              <Button onClick={() => setIsAddPointOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Point
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Passed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Review Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-red-500 rounded" style={{ borderTop: '2px dashed red' }}></div>
              <span className="text-sm">Min Specification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-green-500 rounded" style={{ borderTop: '2px dashed green' }}></div>
              <span className="text-sm">Max Specification</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}