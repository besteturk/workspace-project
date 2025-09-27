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
import { useState } from "react";

const Teams = () => {
   const [inviteEmail, setInviteEmail] = useState("");

   const teamInfo = {
      name: "Design Team Alpha",
      description:
         "A collaborative team focused on creating amazing user experiences and innovative design solutions.",
      memberCount: 8,
      created: "March 2024",
   };

   const members = [
      {
         id: 1,
         name: "Alice Johnson",
         email: "alice@company.com",
         role: "Admin",
         initials: "AJ",
         tags: ["Designer", "Team Lead"],
         avatar: "bg-primary",
      },
      {
         id: 2,
         name: "Bob Smith",
         email: "bob@company.com",
         role: "Member",
         initials: "BS",
         tags: ["Developer", "Frontend"],
         avatar: "bg-secondary",
      },
      {
         id: 3,
         name: "Carol Davis",
         email: "carol@company.com",
         role: "Member",
         initials: "CD",
         tags: ["Designer", "UX"],
         avatar: "bg-accent",
      },
      {
         id: 4,
         name: "David Wilson",
         email: "david@company.com",
         role: "Member",
         initials: "DW",
         tags: ["Developer", "Backend"],
         avatar: "bg-success",
      },
      {
         id: 5,
         name: "Eva Martinez",
         email: "eva@company.com",
         role: "Member",
         initials: "EM",
         tags: ["Product Manager"],
         avatar: "bg-destructive",
      },
   ];

   const handleInvite = () => {
      if (inviteEmail.trim()) {
         console.log("Inviting:", inviteEmail);
         setInviteEmail("");
      }
   };

   const getRoleIcon = (role: string) => {
      return role === "Admin" ? (
         <Crown className="w-4 h-4 text-accent" />
      ) : (
         <Shield className="w-4 h-4 text-muted-foreground" />
      );
   };

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
                     <h2 className="text-2xl font-bold text-foreground mb-2">{teamInfo.name}</h2>
                     <p className="text-muted-foreground">{teamInfo.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                     <div>
                        <span className="text-muted-foreground">Members: </span>
                        <span className="font-medium text-foreground">{teamInfo.memberCount}</span>
                     </div>
                     <div>
                        <span className="text-muted-foreground">Created: </span>
                        <span className="font-medium text-foreground">{teamInfo.created}</span>
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
                  <div className="space-y-4">
                     {members.map((member) => (
                        <div
                           key={member.id}
                           className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted/70 sm:flex-row sm:items-center sm:justify-between"
                        >
                           <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                 <AvatarFallback
                                    className={`${member.avatar} text-white font-medium`}
                                 >
                                    {member.initials}
                                 </AvatarFallback>
                              </Avatar>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-foreground">{member.name}</h3>
                                    {getRoleIcon(member.role)}
                                 </div>
                                 <p className="text-sm text-muted-foreground">{member.email}</p>
                                 <div className="mt-2 flex flex-wrap gap-1">
                                    {member.tags.map((tag, index) => (
                                       <Badge
                                          key={index}
                                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs"
                                       >
                                          {tag}
                                       </Badge>
                                    ))}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 self-start sm:self-auto">
                              <Badge variant={member.role === "Admin" ? "default" : "outline"}>
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
                           <p className="text-2xl font-bold text-foreground">{members.length}</p>
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
                           <p className="text-2xl font-bold text-foreground">2</p>
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
                           <p className="text-2xl font-bold text-foreground">3</p>
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
