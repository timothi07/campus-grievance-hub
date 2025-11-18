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
import ComplaintDetail from "./ComplaintDetail";

type ComplaintStatus = "all" | "pending" | "in_progress" | "resolved";

const ComplaintList = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus>("all");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["complaints", user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("complaints")
        .select(`
          *,
          categories(name),
          departments(name)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
        <h2 className="text-2xl font-bold text-foreground">My Complaints</h2>
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
              className="cursor-pointer hover:border-primary transition-colors"
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
                  {getStatusBadge(complaint.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {complaint.description}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <FileText className="mr-1 h-3 w-3" />
                  Submitted on {format(new Date(complaint.created_at), "PPP")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No complaints found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "You haven't submitted any complaints yet."
                : `You don't have any ${statusFilter.replace("_", " ")} complaints.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComplaintList;
