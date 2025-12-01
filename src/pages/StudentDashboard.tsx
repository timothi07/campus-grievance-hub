import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, FileText, PlusCircle, User, Settings } from "lucide-react";
import ComplaintList from "@/components/student/ComplaintList";
import ComplaintForm from "@/components/student/ComplaintForm";
import StudentProfile from "@/components/student/StudentProfile";
import OnboardingTutorial from "@/components/onboarding/OnboardingTutorial";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("complaints");

  useKeyboardShortcuts([
    { key: "n", ctrlKey: true, action: () => setActiveTab("new"), description: "New complaint" },
    { key: "c", ctrlKey: true, action: () => setActiveTab("complaints"), description: "View complaints" },
    { key: "p", ctrlKey: true, action: () => setActiveTab("profile"), description: "View profile" },
    { key: "s", ctrlKey: true, action: () => setActiveTab("settings"), description: "Settings" },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <OnboardingTutorial />
      
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.user_metadata?.name}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="complaints">
              <FileText className="mr-2 h-4 w-4" />
              My Complaints
            </TabsTrigger>
            <TabsTrigger value="new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Complaint
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            <ComplaintList />
          </TabsContent>

          <TabsContent value="new">
            <ComplaintForm onSuccess={() => setActiveTab("complaints")} />
          </TabsContent>

          <TabsContent value="profile">
            <StudentProfile />
          </TabsContent>

          <TabsContent value="settings">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
