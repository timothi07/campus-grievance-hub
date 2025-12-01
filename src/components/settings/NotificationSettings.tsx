import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationPreferences {
  status_updates: boolean;
  new_comments: boolean;
  assigned_complaints: boolean;
  email_notifications: boolean;
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    status_updates: true,
    new_comments: true,
    assigned_complaints: true,
    email_notifications: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences({
          status_updates: data.status_updates,
          new_comments: data.new_comments,
          assigned_complaints: data.assigned_complaints,
          email_notifications: data.email_notifications,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...newPreferences,
        });

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
      loadPreferences();
    }
  };

  if (loading) {
    return <Card><CardContent className="pt-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="status-updates" className="flex-1">
            <div className="font-medium">Status Updates</div>
            <div className="text-sm text-muted-foreground">Get notified when complaint status changes</div>
          </Label>
          <Switch
            id="status-updates"
            checked={preferences.status_updates}
            onCheckedChange={(checked) => updatePreference("status_updates", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="new-comments" className="flex-1">
            <div className="font-medium">New Comments</div>
            <div className="text-sm text-muted-foreground">Get notified about new comments on your complaints</div>
          </Label>
          <Switch
            id="new-comments"
            checked={preferences.new_comments}
            onCheckedChange={(checked) => updatePreference("new_comments", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="assigned-complaints" className="flex-1">
            <div className="font-medium">Assigned Complaints</div>
            <div className="text-sm text-muted-foreground">Get notified when complaints are assigned to you</div>
          </Label>
          <Switch
            id="assigned-complaints"
            checked={preferences.assigned_complaints}
            onCheckedChange={(checked) => updatePreference("assigned_complaints", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications" className="flex-1">
            <div className="font-medium">Email Notifications</div>
            <div className="text-sm text-muted-foreground">Receive notifications via email</div>
          </Label>
          <Switch
            id="email-notifications"
            checked={preferences.email_notifications}
            onCheckedChange={(checked) => updatePreference("email_notifications", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
