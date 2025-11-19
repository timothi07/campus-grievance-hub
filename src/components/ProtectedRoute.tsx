import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "staff" | "admin";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();
  const [roleChecking, setRoleChecking] = useState(true);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (user && requiredRole) {
        const hasAccess = await hasRole(requiredRole);
        setHasRequiredRole(hasAccess);
      } else if (user) {
        setHasRequiredRole(true);
      }
      setRoleChecking(false);
    };
    
    if (!loading) {
      checkRole();
    }
  }, [user, loading, requiredRole, hasRole]);

  if (loading || roleChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !hasRequiredRole) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
