import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Edit, FileText, Clock, Save, Mail, MapPin, Calendar } from "lucide-react";
import { useState } from "react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "Alice Johnson",
    email: "alice.johnson@company.com",
    role: "Senior Product Designer",
    location: "San Francisco, CA",
    bio: "Passionate about creating user-centered designs and innovative solutions. I love collaborating with cross-functional teams to bring ideas to life.",
    joinedDate: "March 2024",
  });

  const tags = ["Designer", "Team Lead", "UX Research", "Prototyping", "Figma Expert"];
  
  const recentContributions = [
    { id: 1, title: "Project Proposal", type: "Created", date: "2 hours ago", status: "active" },
    { id: 2, title: "Design System", type: "Updated", date: "1 day ago", status: "active" },
    { id: 3, title: "User Research Notes", type: "Commented", date: "3 days ago", status: "active" },
    { id: 4, title: "Meeting Minutes", type: "Created", date: "1 week ago", status: "archived" },
    { id: 5, title: "Product Roadmap", type: "Updated", date: "2 weeks ago", status: "active" },
  ];

  const handleSave = () => {
    console.log("Saving profile:", profile);
    setIsEditing(false);
  };

  const getContributionIcon = (type: string) => {
    switch (type) {
      case "Created": return "bg-success";
      case "Updated": return "bg-primary";
      case "Commented": return "bg-secondary";
      default: return "bg-muted";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-primary hover:bg-primary/90"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    AJ
                  </AvatarFallback>
                </Avatar>
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="text-center"
                    />
                    <Input
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="text-center"
                    />
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-xl">{profile.name}</CardTitle>
                    <p className="text-muted-foreground">{profile.role}</p>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="text-sm"
                      />
                    ) : (
                      <span className="text-muted-foreground">{profile.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="text-sm"
                      />
                    ) : (
                      <span className="text-muted-foreground">{profile.location}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined {profile.joinedDate}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Bio</h3>
                  {isEditing ? (
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
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
                  <FileText className="w-5 h-5 text-primary" />
                  Recent Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentContributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getContributionIcon(contribution.type)}`}></div>
                        <div>
                          <h3 className="font-medium text-foreground">{contribution.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {contribution.type} • {contribution.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={contribution.status === "active" ? "default" : "outline"}>
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

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">24</p>
                      <p className="text-sm text-muted-foreground">Pages Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-secondary/10 rounded-full">
                      <Clock className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">156</p>
                      <p className="text-sm text-muted-foreground">Hours This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;