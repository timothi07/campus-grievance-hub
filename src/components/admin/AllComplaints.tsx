import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import ComplaintDetail from "@/components/student/ComplaintDetail";

type ComplaintStatus = "all" | "pending" | "in_progress" | "resolved";

const AllComplaints = () => {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus>("all");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["admin-complaints", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("complaints")
        .select(`
          *,
          categories(name),
          departments(name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">All Complaints</h2>
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
                      {complaint.categories?.name} • {complaint.departments?.name}
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
            <p className="text-muted-foreground">No complaints found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllComplaints;
