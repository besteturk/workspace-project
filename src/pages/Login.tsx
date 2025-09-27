import { useState } from "react";
import logo from "@/../images/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Login = () => {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const navigate = useNavigate();

   const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Mock login - in real app would validate credentials
      navigate("/dashboard");
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
                  <Button
                     type="submit"
                     className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                     Login
                  </Button>
               </form>
            </CardContent>
         </Card>
      </div>
   );
};

export default Login;
