import { ReactNode } from "react";
import logo from "@/../images/logo.png";
import { NavLink, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
   LayoutDashboard,
   FileText,
   Calendar,
   MessageSquare,
   Users,
   User,
   ChevronDown,
   LogOut,
} from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
   children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
   const location = useLocation();

   const navigation = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Pages", href: "/pages", icon: FileText },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Messages", href: "/messaging", icon: MessageSquare },
      { name: "Teams", href: "/teams", icon: Users },
      { name: "Profile", href: "/profile", icon: User },
   ];

   const isActive = (path: string) => location.pathname === path;

   return (
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
         {/* Sidebar */}
         <aside className="hidden h-full w-72 shrink-0 p-4 lg:flex">
            <Card className="flex h-full w-full flex-col overflow-hidden shadow-card">
               <div className="flex h-full flex-col px-6">
                  {/* Logo */}
                  <div className="flex py-4 justify-center items-center">
                     <img
                        src={logo}
                        alt="Logo"
                        className="max-w-max h-16 object-contain"
                     />
                  </div>

                  {/* Team Selector */}
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="outline"
                           className="w-full justify-between mb-6"
                        >
                           <span>Design Team Alpha</span>
                           <ChevronDown className="w-4 h-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56">
                        <DropdownMenuItem>Design Team Alpha</DropdownMenuItem>
                        <DropdownMenuItem>Marketing Team</DropdownMenuItem>
                        <DropdownMenuItem>Product Team</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Create New Team</DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Navigation */}
                  <nav className="space-y-2">
                     {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                           <NavLink
                              key={item.name}
                              to={item.href}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                 isActive(item.href)
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              }`}
                           >
                              <Icon className="w-4 h-4" />
                              {item.name}
                           </NavLink>
                        );
                     })}
                  </nav>

                  {/* User Profile */}
                  <div className="mt-auto py-6">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <div>
                              <Button
                                 variant="ghost"
                                 className="w-full justify-start gap-3 h-auto"
                              >
                                 <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                       AJ
                                    </AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-foreground">
                                       Alice Johnson
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       alice@company.com
                                    </p>
                                 </div>
                                 <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              </Button>
                           </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                           className="w-56"
                           align="end"
                        >
                           <DropdownMenuItem>
                              <User className="w-4 h-4 mr-2" />
                              Profile Settings
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem>
                              <LogOut className="w-4 h-4 mr-2" />
                              Sign Out
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               </div>
            </Card>
         </aside>

         {/* Main Content */}
         <main className="flex h-full flex-1 min-h-0">
            <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto p-6">
               <div className="flex h-full min-h-0 flex-col">{children}</div>
            </div>
         </main>
      </div>
   );
};
