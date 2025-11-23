import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, UserCog } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

type UserRole = "student" | "staff" | "admin";

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const [newDepartment, setNewDepartment] = useState<number | null | "">(""); // Changed type

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      // Fetch profiles with departments
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          departments(id, name)
        `)
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;
      
      // Fetch all user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (rolesError) throw rolesError;
      
      // Combine the data
      return profilesData?.map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.id) || []
      })) || [];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setSelectedUserId(null);
      setNewRole("");
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating role:", error);
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ userId, departmentId }: { userId: string; departmentId: number | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ department_id: departmentId })
        .eq("id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setSelectedUserId(null);
      setNewDepartment("");
      toast({
        title: "Department updated",
        description: "User department has been updated successfully.",
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

  const handleUpdateRole = (userId: string) => {
    if (!newRole) return;
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleUpdateDepartment = (userId: string) => {
    if (newDepartment === "") return;
    updateDepartmentMutation.mutate({ 
      userId, 
      departmentId: newDepartment
    });
  };

  const getRoleBadge = (roles: any) => {
    const role = roles?.[0]?.role || "student";
    const roleColors = {
      admin: "bg-red-500/20 text-red-700 border-red-500/30",
      staff: "bg-blue-500/20 text-blue-700 border-blue-500/30",
      student: "bg-green-500/20 text-green-700 border-green-500/30",
    };
    
    return (
      <Badge variant="outline" className={roleColors[role as keyof typeof roleColors]}>
        <Shield className="mr-1 h-3 w-3" />
        {role.toUpperCase()}
      </Badge>
    );
  };

  if (usersLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
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
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Users className="h-6 w-6" />
          User Management
        </CardTitle>
        <CardDescription>Manage user roles and department assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Register Number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.register_number || "N/A"}</TableCell>
                    <TableCell>{getRoleBadge(user.user_roles)}</TableCell>
                    <TableCell>{user.departments?.name || "Not assigned"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "PP")}
                    </TableCell>
                    <TableCell>
                      {selectedUserId === user.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRole(user.id)}
                              disabled={!newRole || updateRoleMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserId(null);
                                setNewRole("");
                                setNewDepartment("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Select 
                              value={newDepartment === "" ? "" : newDepartment === null ? "none" : newDepartment.toString()} 
                              onValueChange={(val) => setNewDepartment(val === "none" ? null : val === "" ? "" : Number(val))}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Assign department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Department</SelectItem>
                                {departments?.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDepartment(user.id)}
                              disabled={newDepartment === "" || updateDepartmentMutation.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <UserCog className="mr-1 h-4 w-4" />
                          Manage
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
