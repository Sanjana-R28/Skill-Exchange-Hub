import { useState, useEffect } from "react";
import { useListSkills, getListSkillsQueryKey, useSendConnectionRequest } from "@workspace/api-client-react";
import { PublicUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skill-badge";
import { Search, MapPin, GraduationCap, UserPlus, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function Discover() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [requestedUsers, setRequestedUsers] = useState<Set<number>>(new Set());

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Programming", label: "Programming" },
    { value: "Design", label: "Design" },
    { value: "Music", label: "Music" },
    { value: "Languages", label: "Languages" },
    { value: "Academics", label: "Academics" },
    { value: "Fitness", label: "Fitness" },
    { value: "Business", label: "Business" },
    { value: "Art", label: "Art" },
  ];

  const queryParams = {
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(category !== "all" ? { category } : {})
  };

  const { data: users, isLoading } = useListSkills(queryParams, {
    query: {
      queryKey: getListSkillsQueryKey(queryParams)
    }
  });

  const sendRequest = useSendConnectionRequest();

  const handleConnect = (userId: number) => {
    sendRequest.mutate(
      { data: { receiverId: userId } },
      {
        onSuccess: () => {
          setRequestedUsers(prev => new Set(prev).add(userId));
          toast({ title: "Connection request sent!" });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        },
        onError: (error: any) => {
          toast({ 
            title: "Failed to send request", 
            description: error?.message || "You may have already sent a request.",
            variant: "destructive" 
          });
        }
      }
    );
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        <p className="text-muted-foreground mt-1">Find classmates with the skills you want to learn.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by skill, name, or keywords..." 
              className="pl-9 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : users && users.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: PublicUser) => {
            const hasRequested = requestedUsers.has(user.id);
            return (
              <Card key={user.id} className="overflow-hidden hover-elevate transition-all border-border/50 hover:border-primary/30 flex flex-col">
                <CardHeader className="pb-4 border-b bg-muted/20">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border border-primary/10">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback className="bg-primary/5 text-primary font-medium">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{user.name}</CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        <span className="truncate">{user.college}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{user.branch}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Can Teach</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {user.skillsOffered.length > 0 ? (
                          user.skillsOffered.map(skill => (
                            <SkillBadge key={skill.id} skill={skill} />
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">None listed</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Wants to Learn</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {user.skillsWanted.length > 0 ? (
                          user.skillsWanted.map(skill => (
                            <SkillBadge key={skill.id} skill={skill} />
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">None listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full" 
                    variant={hasRequested ? "secondary" : "default"}
                    disabled={hasRequested || sendRequest.isPending}
                    onClick={() => handleConnect(user.id)}
                  >
                    {hasRequested ? (
                      <><Check className="h-4 w-4 mr-2" /> Requested</>
                    ) : (
                      <><UserPlus className="h-4 w-4 mr-2" /> Connect</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-lg border border-dashed border-border mt-8">
          <Search className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
          <h3 className="text-xl font-bold mb-2">No users found</h3>
          <p className="text-muted-foreground max-w-md">
            We couldn't find anyone matching your search criteria. Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
}