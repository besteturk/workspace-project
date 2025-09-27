import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Users, MessageSquare } from "lucide-react";

const Dashboard = () => {
  const recentPages = [
    { id: 1, title: "Project Proposal", lastEdited: "2 hours ago", editor: "Alice Johnson" },
    { id: 2, title: "Meeting Notes", lastEdited: "1 day ago", editor: "Bob Smith" },
    { id: 3, title: "Design System", lastEdited: "3 days ago", editor: "Carol Davis" },
  ];

  const teamActivity = [
    { id: 1, action: "Alice created a new page", page: "Project Proposal", time: "2 hours ago", type: "page" },
    { id: 2, action: "Bob commented on", page: "Meeting Notes", time: "4 hours ago", type: "comment" },
    { id: 3, action: "Carol updated", page: "Design System", time: "1 day ago", type: "update" },
    { id: 4, action: "Team meeting scheduled", page: "Weekly Sync", time: "2 days ago", type: "calendar" },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "page": return <FileText className="w-4 h-4" />;
      case "comment": return <MessageSquare className="w-4 h-4" />;
      case "update": return <Clock className="w-4 h-4" />;
      case "calendar": return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <Button className="bg-primary hover:bg-primary/90">
            <FileText className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Pages */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                  <div>
                    <h3 className="font-medium text-foreground">{page.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Edited by {page.editor} • {page.lastEdited}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
                    View
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Team Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.action}</span>{" "}
                      <span className="text-primary">{activity.page}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-sm text-muted-foreground">Active Pages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">8</p>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-full">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">24</p>
                  <p className="text-sm text-muted-foreground">Messages Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;