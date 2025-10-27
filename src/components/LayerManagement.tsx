import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Layer {
  id: string;
  name: string;
  display_order: number;
  color: string;
  is_active: boolean;
}

export const LayerManagement = ({ onLayersUpdated }: { onLayersUpdated?: () => void }) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    display_order: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLayers();
  }, []);

  const fetchLayers = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from("construction_layers")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setLayers(data || []);
    } catch (error) {
      console.error("Error fetching layers:", error);
      toast({
        title: "Error",
        description: "Failed to load layers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (layer?: Layer) => {
    if (layer) {
      setEditingLayer(layer);
      setFormData({
        name: layer.name,
        color: layer.color,
        display_order: layer.display_order,
      });
    } else {
      setEditingLayer(null);
      setFormData({
        name: "",
        color: "#3b82f6",
        display_order: layers.length + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, user_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;

      if (editingLayer) {
        const { error } = await supabase
          .from("construction_layers")
          .update({
            name: formData.name,
            color: formData.color,
            display_order: formData.display_order,
          })
          .eq("id", editingLayer.id);

        if (error) throw error;
        toast({ title: "Success", description: "Layer updated successfully" });
      } else {
        const { error } = await supabase.from("construction_layers").insert({
          company_id: profile.company_id,
          name: formData.name,
          color: formData.color,
          display_order: formData.display_order,
          created_by: profile.user_id,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Layer created successfully" });
      }

      setIsDialogOpen(false);
      fetchLayers();
      onLayersUpdated?.();
    } catch (error: any) {
      console.error("Error saving layer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save layer",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this layer?")) return;

    try {
      const { error } = await supabase
        .from("construction_layers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Layer deleted successfully" });
      fetchLayers();
      onLayersUpdated?.();
    } catch (error) {
      console.error("Error deleting layer:", error);
      toast({
        title: "Error",
        description: "Failed to delete layer",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading layers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Layer
        </Button>
      </div>

      <div className="grid gap-4">
        {layers.map((layer) => (
          <Card key={layer.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: layer.color }}
                />
                <div>
                  <div className="font-medium">{layer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Order: {layer.display_order}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(layer)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(layer.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLayer ? "Edit Layer" : "Add New Layer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Layer Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., SUB GRADE"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_order: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
