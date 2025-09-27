import { ReactNode } from "react";
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
  LogOut
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
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 p-6">
          <Card className="h-full shadow-card">
            <div className="p-6">
              {/* Logo */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-primary">Thia</h1>
              </div>

              {/* Team Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mb-6">
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
              <div className="mt-auto pt-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          AJ
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">Alice Johnson</p>
                        <p className="text-xs text-muted-foreground">alice@company.com</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
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
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <main className="h-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};