import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, FileText, PlusCircle, User } from "lucide-react";
import ComplaintList from "@/components/student/ComplaintList";
import ComplaintForm from "@/components/student/ComplaintForm";
import StudentProfile from "@/components/student/StudentProfile";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("complaints");

  return (
    <div className="min-h-screen bg-background">
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
          <TabsList className="grid w-full grid-cols-3 mb-8">
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
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
