import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate("/student", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero">
      <div className="text-center space-y-8 max-w-2xl px-4 animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="p-6 gradient-primary rounded-3xl shadow-glow animate-scale-in">
            <FileText className="h-16 w-16 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
          Student Complaint System
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
          Submit and track your complaints efficiently with our modern platform
        </p>
        <div className="pt-4">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")} 
            className="text-lg px-8 py-6 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
