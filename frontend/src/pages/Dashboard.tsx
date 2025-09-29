import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Users, MessageSquare } from "lucide-react";
import { ApiError } from "@/lib/api";
import { api } from "@/services/api";
import type { NoteSummary } from "@/services/api";
import { useNavigate } from "react-router-dom";

type DashboardStats = {
   activePages: number;
   teamMembers: number;
   messagesToday: number;
};

type RecentPage = {
   id: number | string;
   title: string;
   lastEdited: string;
   editor: string;
};

type TeamActivityItem = {
   id: number | string;
   action: string;
   page: string;
   time: string;
   type: "page" | "comment" | "update" | "calendar" | string;
};

const DEFAULT_STATS: DashboardStats = {
   activePages: 0,
   teamMembers: 0,
   messagesToday: 0,
};

const DEFAULT_RECENT_PAGES: RecentPage[] = [];
const DEFAULT_TEAM_ACTIVITY: TeamActivityItem[] = [];

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelativeTime(timestamp: string | undefined) {
   if (!timestamp) return "Unknown";

   const target = new Date(timestamp).getTime();
   if (Number.isNaN(target)) return "Unknown";

   const now = Date.now();
   const diff = target - now;
   const minutes = Math.round(diff / (1000 * 60));

   const ranges = {
      year: 60 * 24 * 365,
      month: 60 * 24 * 30,
      week: 60 * 24 * 7,
      day: 60 * 24,
      hour: 60,
      minute: 1,
   } as const;

   for (const [unit, amount] of Object.entries(ranges)) {
      if (Math.abs(minutes) >= amount || unit === "minute") {
         const value = minutes / amount;
         return relativeTimeFormat.format(Math.round(value), unit as Intl.RelativeTimeFormatUnit);
      }
   }

   return "Just now";
}

const Dashboard = () => {
   const navigate = useNavigate();
   const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
   const [recentPages, setRecentPages] = useState<RecentPage[]>(DEFAULT_RECENT_PAGES);
   const [teamActivity, setTeamActivity] = useState<TeamActivityItem[]>(DEFAULT_TEAM_ACTIVITY);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const controller = new AbortController();

      const loadDashboard = async () => {
         setLoading(true);
         setError(null);

         try {
            const data = await api.notes.listMyNotes({ limit: 5 }, { signal: controller.signal });

            const notes: NoteSummary[] = Array.isArray(data?.notes) ? data.notes : [];

            const mappedPages: RecentPage[] = notes.map((note) => ({
               id: note.note_id,
               title: note.title?.trim() || "Untitled",
               lastEdited: formatRelativeTime(note.updated_at ?? note.created_at),
               editor: [note.first_name, note.last_name].filter(Boolean).join(" ") || "Unknown",
            }));

            const mappedActivity: TeamActivityItem[] = notes.map((note) => ({
               id: `${note.note_id}-activity`,
               action: `${note.first_name ?? "Someone"} updated`,
               page: note.title?.trim() || "Untitled",
               time: formatRelativeTime(note.updated_at ?? note.created_at),
               type: "update",
            }));

            setRecentPages(mappedPages);
            setTeamActivity(mappedActivity);
            setStats((prev) => ({
               ...prev,
               activePages: notes.length ?? DEFAULT_STATS.activePages,
            }));
         } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to load dashboard data", err);

            const message = err instanceof ApiError ? err.message : "Dashboard verileri alınamadı";
            setError(message);
            setRecentPages(DEFAULT_RECENT_PAGES);
            setTeamActivity(DEFAULT_TEAM_ACTIVITY);
            setStats(DEFAULT_STATS);
         } finally {
            if (!controller.signal.aborted) {
               setLoading(false);
            }
         }
      };

      loadDashboard();

      return () => controller.abort();
   }, []);

   const getActivityIcon = (type: string) => {
      switch (type) {
         case "page":
            return <FileText className="w-4 h-4" />;
         case "comment":
            return <MessageSquare className="w-4 h-4" />;
         case "update":
            return <Clock className="w-4 h-4" />;
         case "calendar":
            return <Users className="w-4 h-4" />;
         default:
            return <FileText className="w-4 h-4" />;
      }
   };

   return (
      <AppLayout>
         <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
               <div className="flex gap-x-2">
                  <Button
                     className="bg-primary hover:bg-primary/90"
                     onClick={() => navigate("/calendar?newEvent=1")}
                  >
                     <FileText className="w-4 h-4 mr-2" />
                     New Event
                  </Button>
                  <Button
                     className="bg-primary hover:bg-primary/90"
                     onClick={() => navigate("/pages?create=new")}
                  >
                     <FileText className="w-4 h-4 mr-2" />
                     New Page
                  </Button>
               </div>
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
                  <CardContent className="space-y-4 ">
                     {error ? (
                        <p className="text-sm text-destructive text-center pt-4">{error}</p>
                     ) : loading && recentPages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">Loading...</p>
                     ) : recentPages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                           No recent pages found.
                        </p>
                     ) : (
                        recentPages.map((page) => (
                           <div
                              key={page.id}
                              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted/70"
                           >
                              <div>
                                 <h3 className="font-medium text-foreground">{page.title}</h3>
                                 <p className="text-sm text-muted-foreground">
                                    Edited by {page.editor} • {page.lastEdited}
                                 </p>
                              </div>
                              <Button
                                 size="sm"
                                 variant="secondary"
                                 className="bg-secondary/10 text-secondary hover:bg-secondary/20"
                                 onClick={() => navigate(`/pages?noteId=${page.id}`)}
                              >
                                 View
                              </Button>
                           </div>
                        ))
                     )}
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
                     {error ? (
                        <p className="text-sm text-destructive text-center pt-4">{error}</p>
                     ) : loading && teamActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">Loading...</p>
                     ) : teamActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                           No recent activity.
                        </p>
                     ) : (
                        teamActivity.map((activity) => (
                           <div
                              key={activity.id}
                              className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                           >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
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
                        ))
                     )}
                  </CardContent>
               </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
               <Card className="shadow-card min-w-36">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                           <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                           <p className="text-2xl font-bold text-foreground">{stats.activePages}</p>
                           <p className="text-sm text-muted-foreground">Active Pages</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
               <Card className="shadow-card min-w-36">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-secondary/10 rounded-full">
                           <Users className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                           <p className="text-2xl font-bold text-foreground">{stats.teamMembers}</p>
                           <p className="text-sm text-muted-foreground">Team Members</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
               <Card className="shadow-card min-w-36">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent/10 rounded-full">
                           <MessageSquare className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                           <p className="text-2xl font-bold text-foreground">
                              {stats.messagesToday}
                           </p>
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
