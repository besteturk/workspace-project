import { useState } from "react";
import logo from "@/../images/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { login as loginRequest } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const Login = () => {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const navigate = useNavigate();

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
         await loginRequest({ email, password });
         navigate("/dashboard");
      } catch (err) {
         const message =
            err instanceof ApiError
               ? typeof err.data === "object" &&
                 err.data !== null &&
                 "error" in err.data &&
                 typeof (err.data as { error?: string }).error === "string"
                  ? (err.data as { error: string }).error ?? err.message
                  : err.message
               : "Login failed. Please try again.";
         setError(message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
         <Card className="w-full max-w-md shadow-card">
            <CardHeader className="flex flex-col items-center gap-4">
               <img
                  src={logo}
                  alt="Thia logo"
                  className="h-16 w-auto object-contain"
               />
            </CardHeader>
            <CardContent className="space-y-6">
               <form
                  onSubmit={handleLogin}
                  className="space-y-4"
               >
                  <div>
                     <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                        required
                     />
                  </div>
                  <div>
                     <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full"
                        required
                     />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                  >
                     {loading ? "Logging in..." : "Login"}
                  </Button>
               </form>
            </CardContent>
         </Card>
      </div>
   );
};

export default Login;
