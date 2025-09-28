import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Users, UserPlus, Settings, Mail, Shield, Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import type { TeamMemberSummary, TeamSummary } from "@/services/api";
import { ApiError } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { logout } from "@/lib/auth";

const Teams = () => {
   const navigate = useNavigate();
   const [inviteEmail, setInviteEmail] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [team, setTeam] = useState<TeamSummary | null>(null);
   const [members, setMembers] = useState<TeamMemberSummary[]>([]);

   useEffect(() => {
      const controller = new AbortController();

      const loadTeams = async () => {
         try {
            setLoading(true);
            setError(null);
            const response = await api.teams.getCurrent({ signal: controller.signal });
            setTeam(response.team);
            setMembers(response.members);
         } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to load team", err);
            if (err instanceof ApiError && err.status === 401) {
               logout();
               navigate("/login");
            } else {
               setError(
                  err instanceof ApiError
                     ? err.message || "Failed to load team information"
                     : "Failed to load team information"
               );
            }
         } finally {
            if (!controller.signal.aborted) {
               setLoading(false);
            }
         }
      };

      loadTeams();

      return () => controller.abort();
   }, [navigate]);

   const handleInvite = () => {
      if (inviteEmail.trim()) {
         console.log("Inviting:", inviteEmail);
         setInviteEmail("");
      }
   };

   const getRoleIcon = (role: string) => {
      return role === "admin" ? (
         <Crown className="w-4 h-4 text-accent" />
      ) : (
         <Shield className="w-4 h-4 text-muted-foreground" />
      );
   };

   const computedStats = useMemo(() => {
      const totalMembers = members.length;
      const admins = members.filter((member) => member.role === "admin").length;
      const pendingInvites = 0;
      return { totalMembers, admins, pendingInvites };
   }, [members]);

   return (
      <AppLayout>
         <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h1 className="text-3xl font-bold text-foreground">Teams</h1>
               <div className="flex flex-wrap items-center gap-2">
                  <Dialog>
                     <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                           <UserPlus className="w-4 h-4 mr-2" />
                           Invite Member
                        </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                           <DialogTitle>Invite Team Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                           <Input
                              type="email"
                              placeholder="Enter email address"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                           />
                           <Button
                              onClick={handleInvite}
                              className="w-full bg-primary hover:bg-primary/90"
                           >
                              <Mail className="w-4 h-4 mr-2" />
                              Send Invitation
                           </Button>
                        </div>
                     </DialogContent>
                  </Dialog>
                  <Button variant="outline">
                     <Settings className="w-4 h-4 mr-2" />
                     Settings
                  </Button>
               </div>
            </div>

            {/* Team Info */}
            <Card className="shadow-card">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Users className="w-5 h-5 text-primary" />
                     Team Information
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div>
                     <h2 className="text-2xl font-bold text-foreground mb-2">
                        {team?.name ?? (loading ? "Loading team..." : "Your Team")}
                     </h2>
                     <p className="text-muted-foreground">
                        {team?.description ??
                           "Collaborate with your teammates to keep work aligned."}
                     </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                     <div>
                        <span className="text-muted-foreground">Members: </span>
                        <span className="font-medium text-foreground">
                           {computedStats.totalMembers}
                        </span>
                     </div>
                     <div>
                        <span className="text-muted-foreground">Admins: </span>
                        <span className="font-medium text-foreground">{computedStats.admins}</span>
                     </div>
                     <div>
                        <span className="text-muted-foreground">Created: </span>
                        <span className="font-medium text-foreground">
                           {team?.created_at
                              ? new Intl.DateTimeFormat("en-US", {
                                   month: "long",
                                   year: "numeric",
                                }).format(new Date(team.created_at))
                              : ""}
                        </span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="shadow-card">
               <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                     <span className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Team Members ({members.length})
                     </span>
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  {loading ? (
                     <p className="text-sm text-muted-foreground text-center">Loading members...</p>
                  ) : error ? (
                     <p className="text-sm text-destructive text-center">{error}</p>
                  ) : members.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center">No members found.</p>
                  ) : (
                     <div className="space-y-4">
                        {members.map((member) => (
                           <div
                              key={member.team_member_id}
                              className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted/70 sm:flex-row sm:items-center sm:justify-between"
                           >
                              <div className="flex items-center gap-4">
                                 <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-primary text-white font-medium">
                                       {`${member.first_name?.[0] ?? ""}${
                                          member.last_name?.[0] ?? ""
                                       }`.trim() ||
                                          member.email?.[0]?.toUpperCase() ||
                                          "@"}
                                    </AvatarFallback>
                                 </Avatar>
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <h3 className="font-medium text-foreground">
                                          {`${member.first_name} ${member.last_name}`.trim() ||
                                             member.email}
                                       </h3>
                                       {getRoleIcon(member.role)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                    {member.job_title ? (
                                       <div className="mt-2">
                                          <Badge className="bg-secondary text-secondary-foreground text-xs">
                                             {member.job_title}
                                          </Badge>
                                       </div>
                                    ) : null}
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                 <Badge variant={member.role === "admin" ? "default" : "outline"}>
                                    {member.role}
                                 </Badge>
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                 >
                                    <Settings className="w-4 h-4" />
                                 </Button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Team Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <Card className="shadow-card">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                           <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                           <p className="text-2xl font-bold text-foreground">
                              {computedStats.totalMembers}
                           </p>
                           <p className="text-sm text-muted-foreground">Active Members</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
               <Card className="shadow-card">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-secondary/10 rounded-full">
                           <Settings className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                           <p className="text-2xl font-bold text-foreground">
                              {computedStats.admins}
                           </p>
                           <p className="text-sm text-muted-foreground">Admins</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
               <Card className="shadow-card">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent/10 rounded-full">
                           <UserPlus className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                           <p className="text-2xl font-bold text-foreground">
                              {computedStats.pendingInvites}
                           </p>
                           <p className="text-sm text-muted-foreground">Pending Invites</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </AppLayout>
   );
};

export default Teams;
