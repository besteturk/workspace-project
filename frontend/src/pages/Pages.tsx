import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Plus, Search, Users, Clock } from "lucide-react";
import { api } from "@/services/api";
import type { NoteSummary } from "@/services/api";
import { ApiError } from "@/lib/api";
import { logout } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const Pages = () => {
   const navigate = useNavigate();
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
   const [notes, setNotes] = useState<NoteSummary[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const controller = new AbortController();

      const loadNotes = async () => {
         try {
            setLoading(true);
            setError(null);
            const response = await api.notes.listMyNotes(
               { limit: 50 },
               { signal: controller.signal }
            );
            setNotes(response.notes);
            if (response.notes.length > 0) {
               setSelectedPageId((prev) => prev ?? response.notes[0].note_id);
            }
         } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to load notes", err);
            if (err instanceof ApiError && err.status === 401) {
               logout();
               navigate("/login");
               return;
            }
            setError(
               err instanceof ApiError
                  ? err.message || "Failed to load notes"
                  : "Failed to load notes"
            );
         } finally {
            if (!controller.signal.aborted) {
               setLoading(false);
            }
         }
      };

      loadNotes();

      return () => {
         controller.abort();
      };
   }, [navigate]);

   const filteredPages = useMemo(() => {
      return notes.filter((page) =>
         (page.title ?? "Untitled").toLowerCase().includes(searchTerm.toLowerCase())
      );
   }, [notes, searchTerm]);

   const selectedNote = useMemo(() => {
      if (selectedPageId == null) return null;
      return notes.find((note) => note.note_id === selectedPageId) ?? null;
   }, [notes, selectedPageId]);

   const activeUsers = useMemo(() => {
      const seen = new Set<string>();

      return notes
         .map((note) => {
            const fullName = `${note.first_name ?? ""} ${note.last_name ?? ""}`.trim();
            const key = note.email ?? fullName;
            if (!key || seen.has(key)) {
               return null;
            }

            seen.add(key);

            const initials = fullName
               .split(" ")
               .map((part) => part[0]?.toUpperCase() ?? "")
               .join("");

            return {
               id: key,
               name: fullName || note.email || "Collaborator",
               initials: initials || note.email?.[0]?.toUpperCase() || "@",
            };
         })
         .filter((user): user is { id: string; name: string; initials: string } => user !== null)
         .slice(0, 3)
         .map((user, index) => ({
            ...user,
            color: ["bg-primary", "bg-secondary", "bg-accent"][index % 3],
         }));
   }, [notes]);

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
                     <div className="relative pt-2">
                        <Search className="absolute mt-1 left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                        {loading ? (
                           <p className="text-sm text-muted-foreground text-center pt-4">
                              Loading pages...
                           </p>
                        ) : error ? (
                           <p className="text-sm text-destructive text-center pt-4">{error}</p>
                        ) : filteredPages.length === 0 ? (
                           <p className="text-sm text-muted-foreground text-center pt-4">
                              No pages found.
                           </p>
                        ) : (
                           filteredPages.map((page) => {
                              const isSelected = selectedPageId === page.note_id;
                              const status = page.termination_marked ? "archived" : "active";
                              const badgeVariant = status === "archived" ? "outline" : "default";
                              const editorName = [page.first_name, page.last_name]
                                 .filter(Boolean)
                                 .join(" ")
                                 .trim();
                              const lastEdited = new Intl.DateTimeFormat("en-US", {
                                 month: "short",
                                 day: "numeric",
                                 hour: "2-digit",
                                 minute: "2-digit",
                              }).format(new Date(page.updated_at ?? page.created_at));

                              return (
                                 <div
                                    key={page.note_id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                                       ? "bg-primary/10 border border-primary/20"
                                       : "hover:bg-muted/50"
                                       }`}
                                    onClick={() => setSelectedPageId(page.note_id)}
                                 >
                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                       <h3 className="font-medium text-foreground leading-tight">
                                          {page.title?.trim() || "Untitled"}
                                       </h3>
                                       <Badge
                                          variant={badgeVariant}
                                          className="text-xs"
                                       >
                                          {status}
                                       </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                       {(editorName || page.email || "Unknown").trim()} •{" "}
                                       {lastEdited}
                                    </p>
                                 </div>
                              );
                           })
                        )}
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
                              {selectedNote?.title?.trim() || "Select a page"}
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
                           {selectedNote
                              ? `Last edited ${new Intl.DateTimeFormat("en-US", {
                                 month: "short",
                                 day: "numeric",
                                 hour: "2-digit",
                                 minute: "2-digit",
                              }).format(
                                 new Date(selectedNote.updated_at ?? selectedNote.created_at)
                              )}`
                              : "Select a page to view details"}
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Editor */}
               <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
                  <CardContent className="flex-1 overflow-auto p-6">
                     <div className={`${selectedNote ? "border border-border" : ""} min-h-[400px] rounded-lg bg-card p-6`}>
                        {selectedNote ? (
                           <div className="space-y-4 text-foreground">
                              <h2 className="text-2xl font-bold text-foreground">
                                 {selectedNote.title?.trim() || "Untitled"}
                              </h2>
                              <div className="h-px bg-border"></div>
                              <div className="whitespace-pre-line text-sm leading-relaxed">
                                 {selectedNote.content?.trim() || "No content available."}
                              </div>
                           </div>
                        ) : (
                           <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              Select a page from the list to view its content.
                           </div>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </AppLayout>
   );
};

export default Pages;
