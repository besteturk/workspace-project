import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card text-center">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            <div className="space-y-3">
              <Link to="/dashboard">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
