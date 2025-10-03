import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Edit, FileText, Mail, MapPin, Save, Calendar as CalendarIcon } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
   fetchProfile as fetchProfileRequest,
   updateProfile as updateProfileRequest,
   getStoredUser,
   logout,
   type ApiUser,
} from "@/lib/auth";

type ProfileFormState = {
   first_name: string;
   last_name: string;
   job_title: string;
   location: string;
   bio: string;
};

// Helper keeps state initialisation consistent between stored user and API responses.
const buildFormState = (user?: ApiUser | null): ProfileFormState => ({
   first_name: user?.first_name ?? "",
   last_name: user?.last_name ?? "",
   job_title: user?.job_title ?? "",
   location: user?.location ?? "",
   bio: user?.bio ?? "",
});

const formatMonthYear = (value?: string | null) => {
   if (!value) return "";
   const date = new Date(value);
   if (Number.isNaN(date.getTime())) return "";
   return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
   }).format(date);
};

const Profile = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
   const storedUser = useMemo(() => getStoredUser(), []);

   const [profile, setProfile] = useState<ApiUser | null>(storedUser);
   // Form mirrors the editable fields in the UI. When you toggle edit mode we sync from `profile`.
   const [form, setForm] = useState<ProfileFormState>(() => buildFormState(storedUser));
   const [isEditing, setIsEditing] = useState(false);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Refresh profile data when the page mounts. Abort if the component unmounts mid-request.
   useEffect(() => {
      const controller = new AbortController();

      const loadProfile = async () => {
         try {
            setLoading(true);
            setError(null);
            const response = await fetchProfileRequest({ signal: controller.signal });
            if (!controller.signal.aborted) {
               setProfile(response.user);
               setForm(buildFormState(response.user));
            }
         } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to load profile", err);

            if (err instanceof ApiError && err.status === 401) {
               logout();
               navigate("/login");
               return;
            }

            const message =
               err instanceof ApiError
                  ? err.message || "Failed to load profile"
                  : "Failed to load profile";
            setError(message);
         } finally {
            if (!controller.signal.aborted) {
               setLoading(false);
            }
         }
      };

      void loadProfile();

      return () => controller.abort();
   }, [navigate]);

   const displayName = useMemo(() => {
      const nameParts = [form.first_name, form.last_name].filter(Boolean).join(" ");
      if (nameParts.trim()) return nameParts.trim();
      if (profile) {
         const fallback = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
         if (fallback.trim()) return fallback.trim();
      }
      return profile?.email ?? "Your Profile";
   }, [form.first_name, form.last_name, profile]);

   const initials = useMemo(() => {
      const source = displayName || profile?.email || "";
      return (
         source
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")
            .slice(0, 2) || "@"
      );
   }, [displayName, profile]);

   // Faux tags make the profile feel richer; remove or replace when backend supplies real data.
   const tags = useMemo(() => {
      const items = new Set<string>();
      if (profile?.role === "admin") items.add("Workspace Admin");
      if (form.job_title) items.add(form.job_title);
      if (form.location) items.add(form.location);
      items.add("Collaboration");
      items.add("Design Systems");
      return Array.from(items);
   }, [profile?.role, form.job_title, form.location]);

   const recentContributions = useMemo(
      () => [
         {
            id: 1,
            title: "Project kickoff notes",
            type: "Created",
            date: "2 hours ago",
            status: "active",
         },
         {
            id: 2,
            title: "Design system audit",
            type: "Updated",
            date: "Yesterday",
            status: "active",
         },
         {
            id: 3,
            title: "Roadmap alignment meeting",
            type: "Commented",
            date: "3 days ago",
            status: "active",
         },
         {
            id: 4,
            title: "Quarterly planning",
            type: "Created",
            date: "1 week ago",
            status: "archived",
         },
         {
            id: 5,
            title: "Team offsite agenda",
            type: "Updated",
            date: "2 weeks ago",
            status: "active",
         },
      ],
      []
   );

   const hasChanges = useMemo(() => {
      if (!profile) return false;
      return (
         (profile.first_name ?? "") !== form.first_name.trim() ||
         (profile.last_name ?? "") !== form.last_name.trim() ||
         (profile.job_title ?? "") !== form.job_title.trim() ||
         (profile.location ?? "") !== form.location.trim() ||
         (profile.bio ?? "") !== form.bio.trim()
      );
   }, [profile, form]);

   const handleEditToggle = useCallback(() => {
      if (!profile) return;
      setForm(buildFormState(profile));
      setIsEditing(true);
      setError(null);
   }, [profile]);

   const handleCancelEditing = useCallback(() => {
      if (!profile) {
         setIsEditing(false);
         return;
      }

      setForm(buildFormState(profile));
      setIsEditing(false);
   }, [profile]);

   // Writes the profile updates and refreshes local state.
   const handleSave = useCallback(async () => {
      if (!profile) return;

      try {
         setSaving(true);
         setError(null);

         const payload = {
            first_name: form.first_name.trim() || undefined,
            last_name: form.last_name.trim() || undefined,
            job_title: form.job_title.trim() || null,
            location: form.location.trim() || null,
            bio: form.bio.trim() || null,
         } as const;

         const response = await updateProfileRequest(payload);
         setProfile(response.user);
         setForm(buildFormState(response.user));
         setIsEditing(false);

         toast({
            title: "Profile updated",
            description: "Your changes have been saved.",
         });
      } catch (err) {
         console.error("Failed to update profile", err);

         if (err instanceof ApiError && err.status === 401) {
            logout();
            navigate("/login");
            return;
         }

         const message =
            err instanceof ApiError
               ? err.message || "Failed to update profile"
               : "Failed to update profile";
         setError(message);
         toast({
            title: "Unable to save profile",
            description: message,
            variant: "destructive",
         });
      } finally {
         setSaving(false);
      }
   }, [form, navigate, profile, toast]);

   const getContributionIcon = (type: string) => {
      switch (type) {
         case "Created":
            return "bg-success";
         case "Updated":
            return "bg-primary";
         case "Commented":
            return "bg-secondary";
         default:
            return "bg-muted";
      }
   };

   return (
      <AppLayout>
         <div className="flex h-full min-h-0 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h1 className="text-3xl font-bold text-foreground">Profile</h1>
               <div className="flex flex-wrap items-center gap-2">
                  {isEditing ? (
                     <>
                        <Button
                           variant="outline"
                           onClick={handleCancelEditing}
                           disabled={saving}
                        >
                           Cancel
                        </Button>
                        <Button
                           className="bg-primary hover:bg-primary/90"
                           onClick={handleSave}
                           disabled={saving || !hasChanges}
                        >
                           {saving ? (
                              <span className="flex items-center gap-2 text-sm">
                                 <Save className="h-4 w-4 animate-spin" />
                                 Saving...
                              </span>
                           ) : (
                              <span className="flex items-center gap-2">
                                 <Save className="h-4 w-4" />
                                 Save Changes
                              </span>
                           )}
                        </Button>
                     </>
                  ) : (
                     <Button
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleEditToggle}
                        disabled={loading || !profile}
                     >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                     </Button>
                  )}
               </div>
            </div>

            {error && (
               <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
               </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
               {/* Profile Info */}
               <div className="lg:col-span-1">
                  <Card className="shadow-card">
                     <CardHeader className="text-center">
                        <Avatar className="mx-auto mb-4 h-24 w-24">
                           <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                              {initials}
                           </AvatarFallback>
                        </Avatar>
                        {isEditing ? (
                           <div className="space-y-3">
                              <Input
                                 value={form.first_name}
                                 onChange={(event) =>
                                    setForm((previous) => ({ ...previous, first_name: event.target.value }))
                                 }
                                 className="text-center"
                                 placeholder="First name"
                              />
                              <Input
                                 value={form.last_name}
                                 onChange={(event) =>
                                    setForm((previous) => ({ ...previous, last_name: event.target.value }))
                                 }
                                 className="text-center"
                                 placeholder="Last name"
                              />
                           </div>
                        ) : (
                           <>
                              <CardTitle className="text-xl">{displayName}</CardTitle>
                              <p className="text-muted-foreground">
                                 {form.job_title || profile?.job_title || "Team Contributor"}
                              </p>
                           </>
                        )}
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="space-y-3">
                           <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                 {profile?.email ?? "you@example.com"}
                              </span>
                           </div>
                           <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {isEditing ? (
                                 <Input
                                    value={form.location}
                                    onChange={(event) =>
                                       setForm((previous) => ({ ...previous, location: event.target.value }))
                                    }
                                    className="text-sm"
                                    placeholder="City, Country"
                                 />
                              ) : (
                                 <span className="text-muted-foreground">
                                    {form.location || "Update your location"}
                                 </span>
                              )}
                           </div>
                           <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                 {profile?.created_at
                                    ? `Joined ${formatMonthYear(profile.created_at)}`
                                    : "Member since 2024"}
                              </span>
                           </div>
                        </div>

                        <div>
                           <h3 className="mb-2 font-medium text-foreground">Bio</h3>
                           {isEditing ? (
                              <Textarea
                                 value={form.bio}
                                 onChange={(event) =>
                                    setForm((previous) => ({ ...previous, bio: event.target.value }))
                                 }
                                 className="min-h-[100px]"
                                 placeholder="Share what you focus on with your team..."
                              />
                           ) : (
                              <p className="text-sm text-muted-foreground">
                                 {form.bio ||
                                    "Share a short note about how you collaborate with teammates and what drives your work."}
                              </p>
                           )}
                        </div>

                        <div>
                           <h3 className="mb-3 font-medium text-foreground">Tags</h3>
                           <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                 <Badge
                                    key={tag}
                                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                 >
                                    {tag}
                                 </Badge>
                              ))}
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               {/* Recent Contributions */}
               <div className="lg:col-span-2">
                  <Card className="shadow-card">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <FileText className="h-5 w-5 text-primary" />
                           Recent Contributions
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="space-y-4">
                           {recentContributions.map((contribution) => (
                              <div
                                 key={contribution.id}
                                 className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted/70 sm:flex-row sm:items-center sm:justify-between"
                              >
                                 <div className="flex items-center gap-4">
                                    <div
                                       className={`h-3 w-3 rounded-full ${getContributionIcon(contribution.type)}`}
                                    />
                                    <div>
                                       <h3 className="font-medium text-foreground">{contribution.title}</h3>
                                       <p className="text-sm text-muted-foreground">
                                          {contribution.type} • {contribution.date}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <Badge
                                       variant={contribution.status === "active" ? "default" : "outline"}
                                    >
                                       {contribution.status}
                                    </Badge>
                                    <Button variant="ghost" size="sm">
                                       View
                                    </Button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
         </div>
      </AppLayout>
   );
};

export default Profile;
