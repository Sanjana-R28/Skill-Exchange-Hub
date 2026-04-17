import { useState } from "react";
import { 
  useGetMyProfile, 
  getGetMyProfileQueryKey,
  useUpdateMyProfile,
  useAddSkill,
  useUpdateSkill,
  useDeleteSkill
} from "@workspace/api-client-react";
import { SkillInputDirection, Skill } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skill-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey()
    }
  });

  const updateProfile = useUpdateMyProfile();
  const addSkill = useAddSkill();
  const deleteSkill = useDeleteSkill();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    college: "",
    branch: "",
    profilePicture: ""
  });

  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "Programming",
    direction: SkillInputDirection.offered
  });

  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const categories = [
    "Programming", "Design", "Music", "Languages", "Academics", "Fitness", "Business", "Art"
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const handleEditProfileStart = () => {
    setProfileData({
      name: profile.name,
      college: profile.college,
      branch: profile.branch,
      profilePicture: profile.profilePicture || ""
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { data: profileData },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMyProfileQueryKey(), data);
          setIsEditingProfile(false);
          toast({ title: "Profile updated successfully" });
        },
        onError: () => {
          toast({ title: "Failed to update profile", variant: "destructive" });
        }
      }
    );
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;

    addSkill.mutate(
      { data: newSkill },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
          setIsAddingSkill(false);
          setNewSkill({ ...newSkill, name: "" });
          toast({ title: "Skill added successfully" });
        },
        onError: () => {
          toast({ title: "Failed to add skill", variant: "destructive" });
        }
      }
    );
  };

  const handleDeleteSkill = (skillId: number) => {
    deleteSkill.mutate(
      { skillId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
          toast({ title: "Skill removed" });
        },
        onError: () => {
          toast({ title: "Failed to remove skill", variant: "destructive" });
        }
      }
    );
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your public presence and skills.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>This is how others see you on the platform</CardDescription>
          </div>
          {!isEditingProfile && (
            <Button variant="outline" size="sm" onClick={handleEditProfileStart}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={profileData.name} 
                    onChange={e => setProfileData({...profileData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePic">Profile Picture URL (optional)</Label>
                  <Input 
                    id="profilePic" 
                    value={profileData.profilePicture} 
                    onChange={e => setProfileData({...profileData, profilePicture: e.target.value})} 
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">College/University</Label>
                  <Input 
                    id="college" 
                    value={profileData.college} 
                    onChange={e => setProfileData({...profileData, college: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch/Major</Label>
                  <Input 
                    id="branch" 
                    value={profileData.branch} 
                    onChange={e => setProfileData({...profileData, branch: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={profile.profilePicture} alt={profile.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <div>
                  <h3 className="text-2xl font-bold">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">College</span>
                    <span className="font-medium">{profile.college}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Branch</span>
                    <span className="font-medium">{profile.branch}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>My Skills</CardTitle>
            <CardDescription>What you can teach and what you want to learn</CardDescription>
          </div>
          <Button onClick={() => setIsAddingSkill(!isAddingSkill)} variant={isAddingSkill ? "secondary" : "default"}>
            {isAddingSkill ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {isAddingSkill ? "Cancel" : "Add Skill"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAddingSkill && (
            <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-4 mb-6 animate-in fade-in slide-in-from-top-2">
              <h4 className="font-medium text-sm">Add a new skill</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Skill Name</Label>
                  <Input 
                    placeholder="e.g. React.js, Guitar, French" 
                    value={newSkill.name} 
                    onChange={e => setNewSkill({...newSkill, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newSkill.category} onValueChange={(v) => setNewSkill({...newSkill, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newSkill.direction} onValueChange={(v: SkillInputDirection) => setNewSkill({...newSkill, direction: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SkillInputDirection.offered}>I can teach this</SelectItem>
                      <SelectItem value={SkillInputDirection.wanted}>I want to learn this</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddSkill} disabled={addSkill.isPending || !newSkill.name.trim()}>
                  {addSkill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Skill
                </Button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">+</div>
                <h3 className="font-bold text-lg">Skills I Offer</h3>
              </div>
              {profile.skillsOffered.length > 0 ? (
                <div className="space-y-2">
                  {profile.skillsOffered.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">{skill.category}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSkill(skill.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-md border-dashed">
                  <p className="text-muted-foreground text-sm">You haven't listed any skills to offer yet.</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center text-chart-2 font-bold text-lg">?</div>
                <h3 className="font-bold text-lg">Skills I Want</h3>
              </div>
              {profile.skillsWanted.length > 0 ? (
                <div className="space-y-2">
                  {profile.skillsWanted.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">{skill.category}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSkill(skill.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-md border-dashed">
                  <p className="text-muted-foreground text-sm">You haven't listed any skills you want to learn.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}