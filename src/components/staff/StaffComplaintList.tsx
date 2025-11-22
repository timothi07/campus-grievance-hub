import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import ComplaintDetail from "@/components/student/ComplaintDetail";

type ComplaintStatus = "all" | "pending" | "in_progress" | "resolved";

const StaffComplaintList = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus>("all");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Get staff's department and fetch student names separately
  const { data: profile } = useQuery({
    queryKey: ["staff-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("department_id")
        .eq("id", user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["staff-complaints", profile?.department_id, statusFilter],
    queryFn: async () => {
      if (!profile?.department_id) return [];

      let query = supabase
        .from("complaints")
        .select(`
          *,
          categories(name),
          departments(name)
        `)
        .eq("department_id", profile.department_id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch student profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, register_number")
          .in("id", userIds);
        
        // Map profiles to complaints
        return data.map(complaint => ({
          ...complaint,
          studentProfile: profiles?.find(p => p.id === complaint.user_id)
        }));
      }
      
      return data;
    },
    enabled: !!profile?.department_id,
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-status-pending text-status-pending-foreground",
      in_progress: "bg-status-in-progress text-status-in-progress-foreground",
      resolved: "bg-status-resolved text-status-resolved-foreground",
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: "bg-green-500/20 text-green-700 border-green-500/30",
      medium: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
      high: "bg-red-500/20 text-red-700 border-red-500/30",
    };
    
    return (
      <Badge variant="outline" className={priorityColors[priority as keyof typeof priorityColors]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (selectedComplaintId) {
    return (
      <ComplaintDetail
        complaintId={selectedComplaintId}
        onBack={() => setSelectedComplaintId(null)}
      />
    );
  }

  if (!profile?.department_id) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">No Department Assigned</p>
          <p className="text-sm text-muted-foreground">
            Please contact an administrator to assign you to a department.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Department Complaints</h2>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplaintStatus)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Complaints</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : complaints && complaints.length > 0 ? (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card
              key={complaint.id}
              className="cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
              onClick={() => setSelectedComplaintId(complaint.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{complaint.title}</CardTitle>
                    <CardDescription>
                      {complaint.categories?.name} • {(complaint as any).studentProfile?.name || 'Unknown'} ({(complaint as any).studentProfile?.register_number || 'N/A'})
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(complaint.status)}
                    {getPriorityBadge(complaint.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {complaint.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Submitted: {format(new Date(complaint.created_at), "PPP")}</span>
                  {complaint.attachment_url && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Has attachment
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No complaints found for your department</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffComplaintList;
