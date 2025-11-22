import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Building2 } from "lucide-react";
import AllComplaints from "@/components/admin/AllComplaints";
import UserManagement from "@/components/admin/UserManagement";
import DepartmentManagement from "@/components/admin/DepartmentManagement";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("complaints");

  return (
    <div className="min-h-screen gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm shadow-soft">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={signOut} className="hover:shadow-soft transition-all">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="complaints">
              <FileText className="mr-2 h-4 w-4" />
              All Complaints
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Building2 className="mr-2 h-4 w-4" />
              Departments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="animate-slide-up">
            <AllComplaints />
          </TabsContent>

          <TabsContent value="users" className="animate-slide-up">
            <UserManagement />
          </TabsContent>

          <TabsContent value="departments" className="animate-slide-up">
            <DepartmentManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
