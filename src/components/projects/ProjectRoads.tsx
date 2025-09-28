import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, MapPin } from 'lucide-react';
import { projectService, type ProjectRoad } from '@/services/projectService';
import { toast } from '@/hooks/use-toast';

interface ProjectRoadsProps {
  projectId: string;
}

export function ProjectRoads({ projectId }: ProjectRoadsProps) {
  const [roads, setRoads] = useState<ProjectRoad[]>([]);
  const [newRoadName, setNewRoadName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchRoads();
  }, [projectId]);

  const fetchRoads = async () => {
    try {
      const roadsData = await projectService.fetchProjectRoads(projectId);
      setRoads(roadsData);
    } catch (error) {
      console.error('Error fetching roads:', error);
      toast({
        title: "Error",
        description: "Failed to load project roads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoad = async () => {
    if (!newRoadName.trim()) return;

    setAdding(true);
    try {
      const newRoad = await projectService.createProjectRoad({
        project_id: projectId,
        name: newRoadName.trim()
      });
      
      setRoads(prev => [...prev, newRoad]);
      setNewRoadName('');
      
      toast({
        title: "Success",
        description: `Road "${newRoadName}" added successfully`,
      });
    } catch (error) {
      console.error('Error adding road:', error);
      toast({
        title: "Error",
        description: "Failed to add road",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRoad = async (roadId: string, roadName: string) => {
    try {
      await projectService.deleteProjectRoad(roadId);
      setRoads(prev => prev.filter(road => road.id !== roadId));
      
      toast({
        title: "Success",
        description: `Road "${roadName}" deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting road:', error);
      toast({
        title: "Error",
        description: "Failed to delete road",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading roads...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Project Roads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Road */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="newRoad" className="sr-only">Road Name</Label>
            <Input
              id="newRoad"
              placeholder="Enter road name (e.g., A1 Highway, Main Street)"
              value={newRoadName}
              onChange={(e) => setNewRoadName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddRoad();
                }
              }}
            />
          </div>
          <Button 
            onClick={handleAddRoad} 
            disabled={!newRoadName.trim() || adding}
          >
            <Plus className="h-4 w-4 mr-2" />
            {adding ? 'Adding...' : 'Add Road'}
          </Button>
        </div>

        {/* Roads List */}
        {roads.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No roads added</h4>
            <p className="text-muted-foreground">
              Add roads to organize test locations within this project.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold">
              Roads ({roads.length})
            </h4>
            <div className="grid gap-3">
              {roads.map((road) => (
                <div
                  key={road.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{road.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      Added {new Date(road.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRoad(road.id, road.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}