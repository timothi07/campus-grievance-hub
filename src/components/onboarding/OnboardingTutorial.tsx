import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, FileText, Filter, Keyboard, Settings } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to the Complaint Portal",
    description: "This system helps you submit, track, and manage complaints efficiently. Let's walk through the key features.",
    icon: <AlertCircle className="h-12 w-12 text-primary" />,
  },
  {
    title: "Submit Complaints",
    description: "Click 'New Complaint' to submit issues. Add detailed descriptions, attach files, and select the appropriate department and category.",
    icon: <FileText className="h-12 w-12 text-primary" />,
  },
  {
    title: "Filter & Search",
    description: "Use the advanced filters to find complaints by status, priority, department, or category. Save your frequently used filters for quick access.",
    icon: <Filter className="h-12 w-12 text-primary" />,
  },
  {
    title: "Keyboard Shortcuts",
    description: "Press Shift+? anytime to see available keyboard shortcuts. Use them to navigate faster through the system.",
    icon: <Keyboard className="h-12 w-12 text-primary" />,
  },
  {
    title: "Customize Notifications",
    description: "Visit your profile settings to control which notifications you receive. Stay informed without being overwhelmed.",
    icon: <Settings className="h-12 w-12 text-primary" />,
  },
];

export default function OnboardingTutorial() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (!data || (!data.completed && !data.skipped)) {
        setOpen(true);
        setCurrentStep(data?.current_step || 0);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const nextStep = currentStep + 1;

    if (nextStep >= steps.length) {
      await completeOnboarding();
    } else {
      setCurrentStep(nextStep);
      await updateProgress(nextStep);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
  };

  const updateProgress = async (step: number) => {
    if (!user) return;

    try {
      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        current_step: step,
        completed: false,
        skipped: false,
      });
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        completed: true,
        current_step: steps.length,
        skipped: false,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;

    try {
      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        skipped: true,
        current_step: currentStep,
        completed: false,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  if (loading) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">{step.icon}</div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            Skip Tutorial
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
