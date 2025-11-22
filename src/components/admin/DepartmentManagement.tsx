import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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

const DepartmentManagement = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [departmentName, setDepartmentName] = useState("");

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select(`
          *,
          profiles(count)
        `)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("departments")
        .insert({ name });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDepartmentName("");
      setIsAdding(false);
      toast({
        title: "Department created",
        description: "New department has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create department. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating department:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { error } = await supabase
        .from("departments")
        .update({ name })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDepartmentName("");
      setEditingId(null);
      toast({
        title: "Department updated",
        description: "Department has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating department:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeleteId(null);
      toast({
        title: "Department deleted",
        description: "Department has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete department. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting department:", error);
    },
  });

  const handleCreate = () => {
    if (!departmentName.trim()) return;
    createMutation.mutate(departmentName.trim());
  };

  const handleUpdate = (id: number) => {
    if (!departmentName.trim()) return;
    updateMutation.mutate({ id, name: departmentName.trim() });
  };

  const startEdit = (dept: any) => {
    setEditingId(dept.id);
    setDepartmentName(dept.name);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setDepartmentName("");
  };

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <Building2 className="h-6 w-6" />
                Department Management
              </CardTitle>
              <CardDescription>Manage departments and organizational structure</CardDescription>
            </div>
            <Button onClick={() => setIsAdding(true)} disabled={isAdding || editingId !== null}>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <Card className="mb-4 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-dept">Department Name</Label>
                    <Input
                      id="new-dept"
                      placeholder="Enter department name"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreate} disabled={!departmentName.trim() || createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Staff Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments && departments.length > 0 ? (
                  departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">
                        {editingId === dept.id ? (
                          <Input
                            value={departmentName}
                            onChange={(e) => setDepartmentName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate(dept.id)}
                            autoFocus
                          />
                        ) : (
                          dept.name
                        )}
                      </TableCell>
                      <TableCell>{dept.profiles?.length || 0} staff members</TableCell>
                      <TableCell>
                        {editingId === dept.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(dept.id)}
                              disabled={!departmentName.trim() || updateMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(dept)}
                              disabled={isAdding || editingId !== null}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteId(dept.id)}
                              disabled={isAdding || editingId !== null}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No departments found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this department. Staff members assigned to this department will be unassigned.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DepartmentManagement;
