import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ComplaintChatProps {
  complaintId: string;
}

export const ComplaintChat = ({ complaintId }: ComplaintChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["messages", complaintId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(name)
        `)
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        complaint_id: complaintId,
        sender_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", complaintId] });
      setMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${complaintId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `complaint_id=eq.${complaintId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", complaintId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [complaintId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage.mutate(message);
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto space-y-4 pr-4">
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender_id === user?.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{(msg.sender as any)?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${msg.sender_id === user?.id ? "items-end" : ""}`}>
                <div
                  className={`rounded-lg px-4 py-2 max-w-md ${
                    msg.sender_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {format(new Date(msg.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={!message.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
