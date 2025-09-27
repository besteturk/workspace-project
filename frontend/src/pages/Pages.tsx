import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Plus, Search, Users, Clock } from "lucide-react";

const Pages = () => {
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedPage, setSelectedPage] = useState("project-proposal");

   const pages = [
      {
         id: "project-proposal",
         title: "Project Proposal",
         lastEdited: "2 hours ago",
         editor: "Alice Johnson",
         status: "active",
      },
      {
         id: "meeting-notes",
         title: "Meeting Notes",
         lastEdited: "1 day ago",
         editor: "Bob Smith",
         status: "draft",
      },
      {
         id: "design-system",
         title: "Design System",
         lastEdited: "3 days ago",
         editor: "Carol Davis",
         status: "active",
      },
      {
         id: "user-research",
         title: "User Research",
         lastEdited: "1 week ago",
         editor: "David Wilson",
         status: "archived",
      },
   ];

   const activeUsers = [
      { id: 1, name: "Alice Johnson", initials: "AJ", color: "bg-primary" },
      { id: 2, name: "Bob Smith", initials: "BS", color: "bg-secondary" },
      { id: 3, name: "Carol Davis", initials: "CD", color: "bg-accent" },
   ];

   const filteredPages = pages.filter((page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <AppLayout>
         <div className="flex h-full min-h-0 flex-col gap-6 lg:flex-row">
            {/* Left Sidebar - Pages List */}
            <div className="flex w-full flex-col gap-6 lg:w-80 lg:flex-none">
               <Card className="flex min-h-[300px] flex-col shadow-card lg:h-full">
                  <CardHeader className="flex-shrink-0 pb-4">
                     <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                           <FileText className="w-5 h-5 text-primary" />
                           Pages
                        </span>
                        <Button
                           size="sm"
                           className="bg-primary hover:bg-primary/90"
                        >
                           <Plus className="w-4 h-4" />
                        </Button>
                     </CardTitle>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                           placeholder="Search pages..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-10"
                        />
                     </div>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 overflow-y-auto">
                     <div className="space-y-2 pr-1">
                        {filteredPages.map((page) => (
                           <div
                              key={page.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                 selectedPage === page.id
                                    ? "bg-primary/10 border border-primary/20"
                                    : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedPage(page.id)}
                           >
                              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                 <h3 className="font-medium text-foreground leading-tight">
                                    {page.title}
                                 </h3>
                                 <Badge
                                    variant={
                                       page.status === "active"
                                          ? "default"
                                          : page.status === "draft"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-xs"
                                 >
                                    {page.status}
                                 </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                 {page.editor} • {page.lastEdited}
                              </p>
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Main Editor Area */}
            <div className="flex flex-1 min-h-0 flex-col gap-6">
               {/* Top Bar */}
               <Card className="shadow-card">
                  <CardContent className="p-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <h1 className="text-xl font-semibold text-foreground">
                              {pages.find((p) => p.id === selectedPage)?.title || "Select a page"}
                           </h1>
                           <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <div className="flex -space-x-2">
                                 {activeUsers.map((user) => (
                                    <Avatar
                                       key={user.id}
                                       className="w-8 h-8 border-2 border-background"
                                    >
                                       <AvatarFallback
                                          className={`${user.color} text-white text-xs`}
                                       >
                                          {user.initials}
                                       </AvatarFallback>
                                    </Avatar>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                           <Clock className="w-4 h-4" />
                           Last edited 2 hours ago
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Editor */}
               <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
                  <CardContent className="flex-1 overflow-auto p-6">
                     <div className="min-h-[400px] rounded-lg border border-border bg-card p-6">
                        <div className="space-y-4">
                           <h2 className="text-2xl font-bold text-foreground">Project Proposal</h2>
                           <div className="h-px bg-border"></div>
                           <div className="space-y-4 text-foreground">
                              <p>
                                 <strong>Executive Summary</strong>
                              </p>
                              <p>
                                 This project aims to develop a comprehensive solution that will
                                 enhance our team's productivity and collaboration capabilities. The
                                 proposed system will integrate seamlessly with our existing
                                 workflow while providing new features that address current pain
                                 points.
                              </p>
                              <p>
                                 <strong>Objectives</strong>
                              </p>
                              <ul className="list-disc pl-6 space-y-1">
                                 <li>Improve team communication and collaboration</li>
                                 <li>Streamline project management processes</li>
                                 <li>Enhance document sharing and version control</li>
                                 <li>Provide real-time editing capabilities</li>
                              </ul>
                              <p>
                                 <strong>Timeline</strong>
                              </p>
                              <p>
                                 The project is expected to be completed within 12 weeks, with major
                                 milestones at weeks 4, 8, and 12.
                              </p>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </AppLayout>
   );
};

export default Pages;
