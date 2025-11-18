import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Paperclip } from "lucide-react";
import { format } from "date-fns";

interface ComplaintDetailProps {
  complaintId: string;
  onBack: () => void;
}

const ComplaintDetail = ({ complaintId, onBack }: ComplaintDetailProps) => {
  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          *,
          categories(name),
          departments(name)
        `)
        .eq("id", complaintId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: statusLog } = useQuery({
    queryKey: ["complaint-status-log", complaintId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_status_log")
        .select(`
          *,
          profiles(name)
        `)
        .eq("complaint_id", complaintId)
        .order("timestamp", { ascending: false });
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{complaint.title}</CardTitle>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>{complaint.categories?.name}</span>
                <span>•</span>
                <span>{complaint.departments?.name}</span>
                <span>•</span>
                <span>Priority: {complaint.priority}</span>
              </div>
            </div>
            {getStatusBadge(complaint.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.attachment_url && (
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Attachment</h3>
              <a
                href={complaint.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <Paperclip className="mr-1 h-4 w-4" />
                View Attachment
              </a>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Submitted on {format(new Date(complaint.created_at), "PPP 'at' p")}
          </div>
        </CardContent>
      </Card>

      {statusLog && statusLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusLog.map((log) => (
                <div key={log.id} className="border-l-2 border-border pl-4 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(log.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), "PPP 'at' p")}
                    </span>
                  </div>
                  {log.note && <p className="text-sm text-muted-foreground mt-1">{log.note}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComplaintDetail;
