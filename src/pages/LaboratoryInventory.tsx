import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  category: string;
  item_name: string;
  quantity: number;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

const categories = [
  "Office Equipment",
  "Laboratory Equipment",
  "Safety Equipment",
  "Computers & IT",
  "Measuring Instruments",
  "Testing Equipment",
  "Furniture",
  "Consumables",
  "Other",
];

export default function LaboratoryInventory() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    item_name: "",
    quantity: 1,
    remarks: "",
  });

  useEffect(() => {
    fetchProjects();
    fetchInventory();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedProject, selectedCategory]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.rpc("user_accessible_projects");
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  };

  const fetchInventory = async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      let query = supabase
        .from("laboratory_inventory")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("category")
        .order("item_name");

      if (selectedProject !== "all") {
        query = query.eq("project_id", selectedProject);
      } else {
        query = query.is("project_id", null);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!profile?.company_id) return;
    if (!formData.category || !formData.item_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("laboratory_inventory").insert({
        company_id: profile.company_id,
        project_id: selectedProject !== "all" ? selectedProject : null,
        category: formData.category,
        item_name: formData.item_name,
        quantity: formData.quantity,
        remarks: formData.remarks || null,
        created_by: profile.user_id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;
    if (!formData.category || !formData.item_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("laboratory_inventory")
        .update({
          category: formData.category,
          item_name: formData.item_name,
          quantity: formData.quantity,
          remarks: formData.remarks || null,
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;

    try {
      const { error } = await supabase
        .from("laboratory_inventory")
        .delete()
        .eq("id", deleteItemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });

      setDeleteItemId(null);
      fetchInventory();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      item_name: item.item_name,
      quantity: item.quantity,
      remarks: item.remarks || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "",
      item_name: "",
      quantity: 1,
      remarks: "",
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laboratory Inventory</h1>
          <p className="text-muted-foreground">
            Manage your laboratory equipment and supplies
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Filters
          </CardTitle>
          <CardDescription>
            Filter inventory by project and category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects (Company-wide)</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            {selectedProject === "all"
              ? "Company-wide inventory"
              : `Inventory for selected project`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell className="text-center font-bold">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {item.remarks || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteItemId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No inventory items</h3>
              <p className="text-muted-foreground mt-2">
                Add your first inventory item to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Add a new item to your laboratory inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="add-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-item-name">Item Name *</Label>
              <Input
                id="add-item-name"
                value={formData.item_name}
                onChange={(e) =>
                  setFormData({ ...formData, item_name: e.target.value })
                }
                placeholder="Enter item name"
              />
            </div>
            <div>
              <Label htmlFor="add-quantity">Quantity</Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <Label htmlFor="add-remarks">Remarks</Label>
              <Textarea
                id="add-remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Add any notes or remarks"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the inventory item details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-item-name">Item Name *</Label>
              <Input
                id="edit-item-name"
                value={formData.item_name}
                onChange={(e) =>
                  setFormData({ ...formData, item_name: e.target.value })
                }
                placeholder="Enter item name"
              />
            </div>
            <div>
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-remarks">Remarks</Label>
              <Textarea
                id="edit-remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Add any notes or remarks"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              inventory item from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
