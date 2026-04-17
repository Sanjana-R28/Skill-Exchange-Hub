import { useListMatches, getListMatchesQueryKey, useSendConnectionRequest } from "@workspace/api-client-react";
import { Match } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ArrowRightLeft, UserPlus, Sparkles, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function Matches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requestedUsers, setRequestedUsers] = useState<Set<number>>(new Set());

  const { data: matches, isLoading } = useListMatches({
    query: {
      queryKey: getListMatchesQueryKey()
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Perfect Matches <Sparkles className="h-6 w-6 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-1">Users who have skills you want, and want skills you have.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {matches.map((match: Match) => {
            const hasRequested = requestedUsers.has(match.user.id);
            return (
              <Card key={match.user.id} className="overflow-hidden border-primary/20 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                        <AvatarImage src={match.user.profilePicture} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">{getInitials(match.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{match.user.name}</CardTitle>
                        <div className="flex flex-col text-sm text-muted-foreground mt-1 gap-0.5">
                          <span className="flex items-center"><GraduationCap className="h-3.5 w-3.5 mr-1.5" />{match.user.college}</span>
                          <span>{match.user.branch}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary text-primary-foreground font-bold text-xs shadow-sm">
                      {Math.round(match.score)}% Match
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                      <ArrowRightLeft className="h-24 w-24 text-primary" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                      <div className="space-y-3 p-4 bg-card rounded-xl border shadow-sm">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">They Teach You</h4>
                        <div className="flex flex-col gap-2">
                          {match.theyTeach.map(skill => (
                            <div key={skill} className="bg-primary/10 text-primary px-3 py-2 rounded-md text-sm font-medium text-center shadow-sm">
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-3 p-4 bg-card rounded-xl border shadow-sm">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">You Teach Them</h4>
                        <div className="flex flex-col gap-2">
                          {match.youTeach.map(skill => (
                            <div key={skill} className="bg-chart-2/10 text-chart-2 px-3 py-2 rounded-md text-sm font-medium text-center shadow-sm">
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 border-t">
                  <Button 
                    className="w-full h-12 text-base font-medium shadow-sm" 
                    variant={hasRequested ? "secondary" : "default"}
                    disabled={hasRequested || sendRequest.isPending}
                    onClick={() => handleConnect(match.user.id)}
                  >
                    {hasRequested ? (
                      <><Check className="h-5 w-5 mr-2" /> Request Sent</>
                    ) : (
                      <><UserPlus className="h-5 w-5 mr-2" /> Send Connection Request</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-lg border border-dashed border-border mt-8">
          <Sparkles className="h-12 w-12 text-primary opacity-30 mb-4" />
          <h3 className="text-xl font-bold mb-2">No perfect matches yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            We haven't found a 2-way match for your skills. Add more skills you offer and want to learn to increase your chances!
          </p>
          <Button variant="outline" asChild>
            <a href="/profile">Update My Skills</a>
          </Button>
        </div>
      )}
    </div>
  );
}