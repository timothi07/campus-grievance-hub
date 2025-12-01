import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import StaffComplaintList from "@/components/staff/StaffComplaintList";
import OnboardingTutorial from "@/components/onboarding/OnboardingTutorial";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function StaffDashboard() {
  const { user, signOut } = useAuth();

  useKeyboardShortcuts([
    { key: "r", ctrlKey: true, action: () => window.location.reload(), description: "Refresh complaints" },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <OnboardingTutorial />
      
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <StaffComplaintList />
      </main>
    </div>
  );
}
