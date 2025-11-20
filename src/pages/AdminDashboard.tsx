import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-slide-up">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-primary">User Management</CardTitle>
              <CardDescription>Manage users and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-secondary">Department Management</CardTitle>
              <CardDescription>Manage departments and categories</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-accent">All Complaints</CardTitle>
              <CardDescription>View and manage all complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
