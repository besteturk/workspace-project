import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Search, Users, Clock, Pencil, Wand2, Check, X } from "lucide-react";
import { api } from "@/services/api";
import type { NoteSummary } from "@/services/api";
import { ApiError } from "@/lib/api";
import { getStoredUser, logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Pages implements a lightweight knowledge base: left column lists notes, right
// column shows the selected page with inline editing for the owner.

const Pages = () => {
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();
   const { toast } = useToast();
   const currentUser = useMemo(() => getStoredUser(), []);
   const currentUserId = currentUser?.user_id;

   const [creatingPage, setCreatingPage] = useState(false);
   const [createFromParamHandled, setCreateFromParamHandled] = useState(false);
   const [hasInitialSelection, setHasInitialSelection] = useState(false);

   const [isEditing, setIsEditing] = useState(false);
   const [editTitle, setEditTitle] = useState("");
   const [editContent, setEditContent] = useState("");
   const [savingEdit, setSavingEdit] = useState(false);

   const [searchTerm, setSearchTerm] = useState("");
   const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

   const [notes, setNotes] = useState<NoteSummary[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [isFabOpen, setFabOpen] = useState(false);

   // Initial note fetch populates the list; aborts cleanly on unmount.
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
      const term = searchTerm.trim().toLowerCase();
      if (!term) return notes;
      return notes.filter((page) => (page.title ?? "Untitled").toLowerCase().includes(term));
   }, [notes, searchTerm]);

   const handleCreatePage = useCallback(async () => {
      if (creatingPage) return;

      try {
         setCreatingPage(true);
         setError(null);

         const response = await api.notes.create({
            title: "Untitled page",
            content: "",
         });

         const newNote = response.note;

         setNotes((previous) => {
            const withoutDuplicate = previous.filter((note) => note.note_id !== newNote.note_id);
            return [newNote, ...withoutDuplicate];
         });

         setSelectedPageId(newNote.note_id);
         setHasInitialSelection(true);
         setIsEditing(true);
         setEditTitle(newNote.title ?? "");
         setEditContent(newNote.content ?? "");
         setFabOpen(false);

         const nextParams = new URLSearchParams(searchParams);
         nextParams.set("noteId", String(newNote.note_id));
         nextParams.delete("create");
         setSearchParams(nextParams, { replace: true });

         toast({
            title: "New page created",
            description: "Start capturing your ideas.",
         });
      } catch (err) {
         console.error("Failed to create page", err);
         if (err instanceof ApiError && err.status === 401) {
            logout();
            navigate("/login");
            return;
         }

         const message =
            err instanceof ApiError ? err.message || "Failed to create page" : "Failed to create page";
         setError(message);
         toast({
            title: "Unable to create page",
            description: message,
            variant: "destructive",
         });
      } finally {
         setCreatingPage(false);
      }
   }, [creatingPage, navigate, searchParams, setSearchParams, toast]);

   // Support deep links that request a fresh page via ?create=true.
   useEffect(() => {
      const shouldCreate = searchParams.get("create");
      if (shouldCreate === "true" && !creatingPage && !createFromParamHandled) {
         setCreateFromParamHandled(true);
         handleCreatePage();
      } else if (shouldCreate !== "true" && createFromParamHandled) {
         setCreateFromParamHandled(false);
      }
   }, [createFromParamHandled, creatingPage, handleCreatePage, searchParams]);

   const selectedNote = useMemo(() => {
      if (selectedPageId == null) return null;
      return notes.find((note) => note.note_id === selectedPageId) ?? null;
   }, [notes, selectedPageId]);

   // Keep the selected page in sync with the query string and fall back to the first note.
   useEffect(() => {
      if (notes.length === 0) {
         setHasInitialSelection(false);
         setSelectedPageId(null);
         return;
      }

      const noteIdParam = searchParams.get("noteId");

      if (!hasInitialSelection && !noteIdParam) {
         const defaultNoteId = notes[0]?.note_id;
         if (defaultNoteId != null) {
            setSelectedPageId(defaultNoteId);

            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("noteId", String(defaultNoteId));
            nextParams.delete("create");
            setSearchParams(nextParams, { replace: true });
         }
         setHasInitialSelection(true);
         return;
      }

      if (noteIdParam) {
         const parsedId = Number(noteIdParam);
         if (!Number.isNaN(parsedId)) {
            const exists = notes.some((note) => note.note_id === parsedId);
            if (exists) {
               setSelectedPageId(parsedId);
               setHasInitialSelection(true);
               return;
            }
         }

         if (!hasInitialSelection) {
            const fallbackNoteId = notes[0]?.note_id;
            if (fallbackNoteId != null) {
               setSelectedPageId(fallbackNoteId);

               const nextParams = new URLSearchParams(searchParams);
               nextParams.set("noteId", String(fallbackNoteId));
               nextParams.delete("create");
               setSearchParams(nextParams, { replace: true });
            }
            setHasInitialSelection(true);
         }
      }
   }, [notes, searchParams, hasInitialSelection, setSearchParams]);

   useEffect(() => {
      const noteIdParam = searchParams.get("noteId");
      if (!noteIdParam) return;

      const parsedId = Number(noteIdParam);
      if (Number.isNaN(parsedId)) return;

      if (parsedId !== selectedPageId && notes.some((note) => note.note_id === parsedId)) {
         setSelectedPageId(parsedId);
      }
   }, [notes, searchParams, selectedPageId]);

   const handleSelectPage = useCallback(
      (noteId: number) => {
         setSelectedPageId(noteId);
         setHasInitialSelection(true);
         setIsEditing(false);
         setSavingEdit(false);
         setFabOpen(false);

         const nextParams = new URLSearchParams(searchParams);
         nextParams.set("noteId", String(noteId));
         nextParams.delete("create");
         setSearchParams(nextParams, { replace: true });
      },
      [searchParams, setSearchParams]
   );

   // When a new note is selected (or edit mode toggles), populate the form fields.
   useEffect(() => {
      if (!selectedNote) {
         setIsEditing(false);
         setEditTitle("");
         setEditContent("");
         return;
      }

      if (!isEditing) {
         setEditTitle(selectedNote.title ?? "");
         setEditContent(selectedNote.content ?? "");
      }
   }, [selectedNote, isEditing]);

   const canEditSelectedNote = useMemo(() => {
      if (!selectedNote) return false;
      if (!currentUserId) return false;
      if (selectedNote.noter_id == null) return true;
      return selectedNote.noter_id === currentUserId;
   }, [selectedNote, currentUserId]);

   const hasEditChanges = useMemo(() => {
      if (!selectedNote) return false;
      const originalTitle = selectedNote.title ?? "";
      const originalContent = selectedNote.content ?? "";

      return originalTitle !== editTitle || originalContent !== editContent;
   }, [selectedNote, editTitle, editContent]);

   const handleStartEditing = useCallback(() => {
      if (!selectedNote) return;
      setEditTitle(selectedNote.title ?? "");
      setEditContent(selectedNote.content ?? "");
      setIsEditing(true);
   }, [selectedNote]);

   const handleCancelEditing = useCallback(() => {
      if (!selectedNote) {
         setIsEditing(false);
         setEditTitle("");
         setEditContent("");
         return;
      }

      setIsEditing(false);
      setEditTitle(selectedNote.title ?? "");
      setEditContent(selectedNote.content ?? "");
   }, [selectedNote]);

   // Persists title/content changes and keeps URL params aligned.
   const handleSaveEdit = useCallback(async () => {
      if (!selectedNote) return;

      try {
         setSavingEdit(true);
         setError(null);

         const payload = {
            title: editTitle.trim() ? editTitle.trim() : undefined,
            content: editContent,
         };

         const response = await api.notes.update(selectedNote.note_id, payload);
         const updatedNote = response.note;

         setNotes((previous) =>
            previous.map((note) =>
               note.note_id === updatedNote.note_id ? { ...note, ...updatedNote } : note
            )
         );
         setSelectedPageId(updatedNote.note_id);
         setIsEditing(false);
         setEditTitle(updatedNote.title ?? "");
         setEditContent(updatedNote.content ?? "");

         const nextParams = new URLSearchParams(searchParams);
         nextParams.set("noteId", String(updatedNote.note_id));
         nextParams.delete("create");
         setSearchParams(nextParams, { replace: true });

         toast({
            title: "Page updated",
            description: "Your changes have been saved.",
         });
      } catch (err) {
         console.error("Failed to update page", err);
         if (err instanceof ApiError && err.status === 401) {
            logout();
            navigate("/login");
            return;
         }

         const message =
            err instanceof ApiError ? err.message || "Failed to update page" : "Failed to update page";
         setError(message);
         toast({
            title: "Unable to update page",
            description: message,
            variant: "destructive",
         });
      } finally {
         setSavingEdit(false);
      }
   }, [editContent, editTitle, navigate, searchParams, selectedNote, setSearchParams, toast]);

   // Build a small list of collaborators to render in the header avatar stack.
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

   const toggleFab = useCallback(() => {
      setFabOpen((previous) => !previous);
   }, []);

   const handleFabEditClick = useCallback(() => {
      if (!canEditSelectedNote || !selectedNote) {
         setFabOpen(false);
         return;
      }

      setFabOpen(false);
      handleStartEditing();
   }, [canEditSelectedNote, handleStartEditing, selectedNote]);

   const handleAiAssistClick = useCallback(() => {
      setFabOpen(false);
      toast({
         title: "AI assistant",
         description: "Workspace AI suggestions are coming soon.",
      });
   }, [toast]);

   useEffect(() => {
      if (!selectedNote) {
         setFabOpen(false);
      }
   }, [selectedNote]);

   const canShowFab = Boolean(selectedNote);
   const canShowEditShortcut = canEditSelectedNote && !isEditing;

   const lastEditedLabel = useMemo(() => {
      if (!selectedNote) return null;
      const formatter = new Intl.DateTimeFormat("en-US", {
         month: "short",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
      return `Last edited ${formatter.format(
         new Date(selectedNote.updated_at ?? selectedNote.created_at)
      )}`;
   }, [selectedNote]);

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
                           onClick={handleCreatePage}
                           disabled={creatingPage}
                           aria-disabled={creatingPage}
                           aria-label="Create page"
                        >
                           <Plus className="w-4 h-4" />
                        </Button>
                     </CardTitle>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                        <Input
                           placeholder="Search pages..."
                           value={searchTerm}
                           onChange={(event) => setSearchTerm(event.target.value)}
                           className="pl-10"
                        />
                     </div>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 overflow-y-auto">
                     <div className="space-y-2 pr-1">
                        {loading ? (
                           <p className="pt-4 text-center text-sm text-muted-foreground">Loading pages...</p>
                        ) : error ? (
                           <p className="pt-4 text-center text-sm text-destructive">{error}</p>
                        ) : filteredPages.length === 0 ? (
                           <p className="pt-4 text-center text-sm text-muted-foreground">No pages found.</p>
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
                                    className={`rounded-lg p-3 transition-colors ${isSelected
                                       ? "border border-primary/20 bg-primary/10"
                                       : "hover:bg-muted/50"
                                       }`}
                                    onClick={() => handleSelectPage(page.note_id)}
                                    role="button"
                                    tabIndex={0}
                                 >
                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                       <h3 className="leading-tight text-foreground">
                                          {page.title?.trim() || "Untitled"}
                                       </h3>
                                       <Badge variant={badgeVariant} className="text-xs">
                                          {status}
                                       </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                       {(editorName || page.email || "Unknown").trim()} • {lastEdited}
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
            <div className="flex min-h-0 flex-1 flex-col gap-6">
               {/* Top Bar */}
               <Card className="shadow-card">
                  <CardContent className="p-4">
                     <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                           <h1 className="text-xl font-semibold text-foreground">
                              {selectedNote?.title?.trim() || "Select a page"}
                           </h1>
                           <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div className="flex -space-x-2">
                                 {activeUsers.map((user) => (
                                    <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                                       <AvatarFallback className={`${user.color} text-xs text-white`}>
                                          {user.initials}
                                       </AvatarFallback>
                                    </Avatar>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground lg:items-end">
                           <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {selectedNote ? lastEditedLabel : "Select a page to view details"}
                           </div>
                           {selectedNote && !canEditSelectedNote ? (
                              <span className="text-xs text-muted-foreground">
                                 You don&apos;t have permission to edit this page.
                              </span>
                           ) : null}
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Editor */}
               <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
                  <CardContent className="relative flex-1 overflow-auto p-6">
                     <div
                        className={`${selectedNote ? "border border-border" : ""
                           } min-h-[400px] rounded-lg bg-card p-6`}
                     >
                        {selectedNote ? (
                           <div className="space-y-4 text-foreground">
                              {isEditing ? (
                                 <Input
                                    value={editTitle}
                                    onChange={(event) => setEditTitle(event.target.value)}
                                    placeholder="Page title"
                                    disabled={savingEdit}
                                 />
                              ) : (
                                 <h2 className="text-2xl font-bold text-foreground">
                                    {selectedNote.title?.trim() || "Untitled"}
                                 </h2>
                              )}
                              <div className="h-px bg-border" />
                              {isEditing ? (
                                 <Textarea
                                    value={editContent}
                                    onChange={(event) => setEditContent(event.target.value)}
                                    placeholder="Start writing your page content..."
                                    className="min-h-[240px]"
                                    disabled={savingEdit}
                                 />
                              ) : (
                                 <div className="whitespace-pre-line text-sm leading-relaxed">
                                    {selectedNote.content?.trim() || "No content available."}
                                 </div>
                              )}
                           </div>
                        ) : (
                           <div className="flex h-full items-center justify-center pt-4 text-sm text-muted-foreground">
                              Select a page from the list to view its content.
                           </div>
                        )}
                     </div>

                     {canShowFab && (
                        <div className="absolute bottom-6 right-6 z-10 flex flex-col items-center justify-center gap-3">
                           {isFabOpen && (
                              <div className="flex flex-col items-center gap-3">
                                 <div className="flex flex-col items-center gap-2">
                                    <Button
                                       size="icon"
                                       variant="ghost"
                                       className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur transition hover:bg-background"
                                       onClick={handleAiAssistClick}
                                    >
                                       <Wand2 className="h-5 w-5 text-primary" />
                                       <span className="sr-only">AI assistant (coming soon)</span>
                                    </Button>
                                    {canShowEditShortcut ? (
                                       <Button
                                          size="icon"
                                          variant="ghost"
                                          className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur transition hover:bg-background"
                                          onClick={handleFabEditClick}
                                       >
                                          <Pencil className="h-5 w-5 text-primary" />
                                          <span className="sr-only">Edit page</span>
                                       </Button>
                                    ) : null}
                                 </div>
                                 {isEditing && canEditSelectedNote ? (
                                    <div className="flex flex-col items-stretch gap-2">
                                       <Button
                                          size="icon"
                                          className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-500/90 disabled:opacity-60"
                                          onClick={handleSaveEdit}
                                          disabled={savingEdit || !hasEditChanges}
                                       >
                                          <Check className="h-4 w-4" />
                                       </Button>
                                       <Button
                                          size="icon"
                                          className="flex items-center justify-center gap-2 rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-500/90 disabled:opacity-60"
                                          onClick={handleCancelEditing}
                                          disabled={savingEdit}
                                       >
                                          <X className="h-4 w-4" />
                                       </Button>
                                    </div>
                                 ) : null}
                              </div>
                           )}
                           <Button
                              size="icon"
                              className={`flex h-14 w-14 items-center justify-center rounded-full bg-primary p-0 text-primary-foreground shadow-xl transition-transform hover:bg-primary/90 ${isFabOpen ? "scale-105" : ""
                                 }`}
                              onClick={toggleFab}
                           >
                              <Plus className={`h-6 w-6 transition-transform ${isFabOpen ? "rotate-45" : ""}`} />
                              <span className="sr-only">Workspace actions</span>
                           </Button>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </div>
         </div>
      </AppLayout>
   );
};

export default Pages;
