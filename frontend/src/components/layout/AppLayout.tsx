import { ReactNode, useEffect, useMemo, useState } from "react";
import logo from "@/../images/logo.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
import { api } from "@/services/api";
import { ApiError } from "@/lib/api";
import { fetchProfile, getStoredUser, logout } from "@/lib/auth";

interface AppLayoutProps {
   children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
   const location = useLocation();
   const navigate = useNavigate();
   const [user, setUser] = useState(() => getStoredUser());
   const [teamName, setTeamName] = useState<string | null>(null);
   const [isLoadingTeam, setIsLoadingTeam] = useState(false);

   const navigation = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Pages", href: "/pages", icon: FileText },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Messages", href: "/messaging", icon: MessageSquare },
      { name: "Teams", href: "/teams", icon: Users },
      { name: "Profile", href: "/profile", icon: User },
   ];

   const isActive = (path: string) => location.pathname === path;

   useEffect(() => {
      const controller = new AbortController();

      const loadProfile = async () => {
         try {
            const response = await fetchProfile({ signal: controller.signal });
            setUser(response.user);
         } catch (error) {
            if (controller.signal.aborted) return;
            if (error instanceof ApiError && error.status === 401) {
               logout();
               navigate("/login");
            } else {
               console.error("Failed to fetch profile", error);
            }
         }
      };

      loadProfile();

      return () => controller.abort();
   }, [navigate]);

   useEffect(() => {
      const controller = new AbortController();

      const loadTeam = async () => {
         try {
            setIsLoadingTeam(true);
            const { team } = await api.teams.getCurrent({ signal: controller.signal });
            setTeamName(team.name);
         } catch (error) {
            if (controller.signal.aborted) return;
            if (error instanceof ApiError && error.status === 401) {
               logout();
               navigate("/login");
            } else {
               console.error("Failed to fetch team", error);
            }
         } finally {
            if (!controller.signal.aborted) {
               setIsLoadingTeam(false);
            }
         }
      };

      loadTeam();

      return () => controller.abort();
   }, [navigate]);

   const userInitials = useMemo(() => {
      if (!user) return "--";
      const firstInitial = user.first_name?.[0]?.toUpperCase() ?? "";
      const lastInitial = user.last_name?.[0]?.toUpperCase() ?? "";
      const initials = `${firstInitial}${lastInitial}`.trim();
      return initials || user.email?.[0]?.toUpperCase() || "@";
   }, [user]);

   const handleLogout = () => {
      logout();
      navigate("/login");
   };

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
                           <span>
                              {teamName ?? (isLoadingTeam ? "Loading team..." : "-")}
                           </span>
                           <ChevronDown className="w-4 h-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56">
                        {teamName ? <DropdownMenuItem>{teamName}</DropdownMenuItem> : null}
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
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
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
                                       {userInitials}
                                    </AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-foreground">
                                       {user
                                          ? `${user.first_name} ${user.last_name}`.trim() ||
                                          user.email
                                          : "Guest"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       {user?.email ?? ""}
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
                           <DropdownMenuItem onSelect={handleLogout}>
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
            <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-scroll p-6">
               <div className="flex h-full min-h-0 flex-col">{children}</div>
            </div>
         </main>
      </div>
   );
};
