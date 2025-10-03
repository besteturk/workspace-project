import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Users, MessageSquare, Calendar as CalendarIcon } from "lucide-react";
import { ApiError } from "@/lib/api";
import { api } from "@/services/api";
import type { NoteSummary, EventSummary } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

// Dashboard aggregates a handful of API calls to give the user a high-level snapshot
// (recent content, active teammates, synthetic task progress) inside the app shell.

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

type MemberProgress = {
   id: number | string;
   name: string;
   role: string;
   percent: number;
};

// Baseline counters ensure the UI never renders undefined numbers while data loads.
const DEFAULT_STATS: DashboardStats = {
   activePages: 0,
   teamMembers: 0,
   messagesToday: 0,
};

const DEFAULT_RECENT_PAGES: RecentPage[] = [];
const DEFAULT_TEAM_ACTIVITY: TeamActivityItem[] = [];

// Reusable formatter keeps human-readable timestamps consistent across sections.
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

const isSameDay = (a: Date, b: Date) =>
   a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatEventTimeRange = (start?: string, end?: string) => {
   if (!start) return "";

   const startDate = new Date(start);
   if (Number.isNaN(startDate.getTime())) return "";

   const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
   const startLabel = startDate.toLocaleTimeString([], timeOptions);

   if (!end) {
      return startLabel;
   }

   const endDate = new Date(end);
   if (Number.isNaN(endDate.getTime())) {
      return startLabel;
   }

   const endLabel = endDate.toLocaleTimeString([], timeOptions);
   return isSameDay(startDate, endDate) ? `${startLabel} – ${endLabel}` : `${startLabel} → ${endLabel}`;
};

const formatDateParam = (value?: string) => {
   if (!value) return "";
   const date = new Date(value);
   if (Number.isNaN(date.getTime())) return "";

   return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
   ].join("-");
};

const Dashboard = () => {
   const navigate = useNavigate();
   const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
   const [recentPages, setRecentPages] = useState<RecentPage[]>(DEFAULT_RECENT_PAGES);
   const [teamActivity, setTeamActivity] = useState<TeamActivityItem[]>(DEFAULT_TEAM_ACTIVITY);
   const [memberProgress, setMemberProgress] = useState<MemberProgress[]>([]);
   const [todayEvents, setTodayEvents] = useState<EventSummary[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Kick off the initial dashboard load (notes + team roster). Everything else derives from this.
   useEffect(() => {
      const controller = new AbortController();

      const loadDashboard = async () => {
         setLoading(true);
         setError(null);

         try {
            // Fetch both datasets in parallel so the page paints quickly on first load.
            const [notesData, teamData, eventsData] = await Promise.all([
               api.notes.listMyNotes({ limit: 5 }, { signal: controller.signal }),
               api.teams.getCurrent({ signal: controller.signal }),
               api.events.list({ signal: controller.signal }),
            ]);

            const notes: NoteSummary[] = Array.isArray(notesData?.notes) ? notesData.notes : [];
            const members = Array.isArray(teamData?.members) ? teamData.members : [];
            const events: EventSummary[] = Array.isArray(eventsData?.events) ? eventsData.events : [];

            // Convert raw notes into light-weight view models for the cards below.
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
               teamMembers: members.length ?? DEFAULT_STATS.teamMembers,
            }));

            // Until we have real task metrics, generate a deterministic pseudo-progress value per teammate.
            const memberProgressPayload: MemberProgress[] = members.map((member, index) => {
               const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || member.email;
               const derived = ((member.user_id ?? index + 1) * 13) % 101;
               const normalized = derived === 0 ? 100 : derived;

               return {
                  id: member.user_id,
                  name: fullName,
                  role: member.job_title ?? member.role ?? "Member",
                  percent: Math.min(100, Math.max(5, normalized)),
               } satisfies MemberProgress;
            });

            setMemberProgress(memberProgressPayload);

            const now = new Date();
            const todaysEvents = events
               .filter((event) => {
                  const start = new Date(event.start_time);
                  return !Number.isNaN(start.getTime()) && isSameDay(start, now);
               })
               .sort(
                  (a, b) =>
                     new Date(a.start_time).getTime() -
                     new Date(b.start_time).getTime()
               );

            setTodayEvents(todaysEvents);
         } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to load dashboard data", err);

            const message = err instanceof ApiError ? err.message : "Dashboard verileri alınamadı";
            setError(message);
            setRecentPages(DEFAULT_RECENT_PAGES);
            setTeamActivity(DEFAULT_TEAM_ACTIVITY);
            setStats(DEFAULT_STATS);
            setMemberProgress([]);
            setTodayEvents([]);
         } finally {
            if (!controller.signal.aborted) {
               setLoading(false);
            }
         }
      };

      loadDashboard();

      return () => controller.abort();
   }, []);

   // Helper maps activity categories to their corresponding icon.
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

            {/* Content overview + activity feed + today's schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

               {/* Today's Events */}
               <Card className="shadow-card">
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Today&apos;s Events
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {error ? (
                        <p className="text-sm text-destructive text-center pt-4">{error}</p>
                     ) : loading && todayEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">Loading...</p>
                     ) : todayEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                           No events scheduled for today.
                        </p>
                     ) : (
                        todayEvents.map((event) => {
                           const timeRange = formatEventTimeRange(event.start_time, event.end_time);
                           const assignedName = [event.assigned_first_name, event.assigned_last_name]
                              .filter(Boolean)
                              .join(" ");
                           const dateParam = formatDateParam(event.start_time);

                           return (
                              <div
                                 key={event.event_id}
                                 className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted/70"
                              >
                                 <div>
                                    <h3 className="font-medium text-foreground">{event.title}</h3>
                                    <p className="text-xs text-muted-foreground">
                                       {timeRange || "All day"}
                                       {assignedName ? ` • ${assignedName}` : ""}
                                    </p>
                                 </div>
                                 <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-secondary/10 text-secondary hover:bg-secondary/20"
                                    onClick={() => navigate(dateParam ? `/calendar?date=${dateParam}` : "/calendar")}
                                 >
                                    View
                                 </Button>
                              </div>
                           );
                        })
                     )}
                  </CardContent>
               </Card>
            </div>

            {/* Lightweight progress tracker derived from the team roster */}
            <Card className="shadow-card">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Users className="w-5 h-5 text-primary" />
                     Task Progress
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  {error ? (
                     <p className="text-sm text-destructive text-center pt-2">{error}</p>
                  ) : loading && memberProgress.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center">Loading...</p>
                  ) : memberProgress.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center">
                        We could not determine team task progress yet.
                     </p>
                  ) : (
                     memberProgress.map((member) => (
                        <div
                           key={member.id}
                           className="space-y-2"
                        >
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-sm font-medium text-foreground">{member.name}</p>
                                 <p className="text-xs text-muted-foreground">{member.role}</p>
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">
                                 {member.percent}%
                              </span>
                           </div>
                           <Progress value={member.percent} />
                        </div>
                     ))
                  )}
               </CardContent>
            </Card>

            {/* Quick Stats */}
            {/* Footer stats keep legacy metrics until we replace them with richer insights */}
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
