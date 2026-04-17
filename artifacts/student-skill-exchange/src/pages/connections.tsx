import { 
  useListConnections, 
  getListConnectionsQueryKey, 
  useRespondToConnection,
  useGetCurrentUser
} from "@workspace/api-client-react";
import { Connection, ConnectionStatus, ConnectionResponseInputStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, MessageSquare, Clock, UserCheck, UserPlus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Connections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: auth } = useGetCurrentUser({ query: { retry: false } });
  
  const { data: board, isLoading } = useListConnections({
    query: {
      queryKey: getListConnectionsQueryKey(),
      refetchInterval: 10000 // Poll every 10s for new connections
    }
  });

  const respond = useRespondToConnection();

  const handleResponse = (connectionId: number, status: ConnectionResponseInputStatus) => {
    respond.mutate(
      { connectionId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
          toast({ 
            title: status === ConnectionResponseInputStatus.accepted ? "Connection accepted!" : "Connection declined",
            variant: status === ConnectionResponseInputStatus.accepted ? "default" : "destructive"
          });
        }
      }
    );
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!board || !auth?.user) return null;

  const currentUserId = auth.user.id;

  const ConnectionCard = ({ connection, type }: { connection: Connection, type: "incoming" | "outgoing" | "accepted" }) => {
    const user = connection.otherUser;
    
    return (
      <Card className="overflow-hidden hover-elevate transition-all border-border/50">
        <CardContent className="p-0">
          <div className="flex items-center p-4">
            <Avatar className="h-12 w-12 mr-4 border">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate">{user.name}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                <span className="truncate">{user.college}</span>
                <span className="mx-1.5">•</span>
                <span className="truncate">{user.branch}</span>
              </div>
            </div>
            
            {type === "incoming" && (
              <div className="flex items-center gap-2 ml-4">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-9 w-9 rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleResponse(connection.id, ConnectionResponseInputStatus.rejected)}
                  disabled={respond.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleResponse(connection.id, ConnectionResponseInputStatus.accepted)}
                  disabled={respond.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {type === "outgoing" && (
              <div className="ml-4">
                <Badge variant="outline" className="bg-muted text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Pending
                </Badge>
              </div>
            )}
            
            {type === "accepted" && (
              <div className="ml-4">
                <Link href={`/messages/${user.id}`}>
                  <Button size="sm" className="rounded-full h-9 px-4 font-medium shadow-sm">
                    <MessageSquare className="h-4 w-4 mr-2" /> Message
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          <div className="bg-muted/30 px-4 py-2 text-xs text-muted-foreground border-t flex justify-between items-center">
            <span>
              {type === "incoming" ? "Wants to connect with you" : 
               type === "outgoing" ? "You requested to connect" : 
               "Connected"}
            </span>
            <span>{formatDistanceToNow(new Date(connection.createdAt), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
        <p className="text-muted-foreground mt-1">Manage your network and requests.</p>
      </div>

      <Tabs defaultValue="accepted" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-12 mb-8 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserCheck className="h-4 w-4 mr-2" />
            Connected
            {board.accepted.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/10">{board.accepted.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Requests
            {board.incoming.length > 0 && (
              <Badge className="ml-2 bg-destructive hover:bg-destructive">{board.incoming.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 mr-2" />
            Sent
            {board.outgoing.length > 0 && (
              <Badge variant="secondary" className="ml-2">{board.outgoing.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="accepted" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          {board.accepted.length > 0 ? (
            <div className="grid gap-4">
              {board.accepted.map(conn => <ConnectionCard key={conn.id} connection={conn} type="accepted" />)}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed rounded-xl bg-muted/10">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium">No connections yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                Start discovering classmates and sending requests to build your peer-learning network.
              </p>
              <Link href="/discover">
                <Button>Discover Classmates</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="incoming" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          {board.incoming.length > 0 ? (
            <div className="grid gap-4">
              {board.incoming.map(conn => <ConnectionCard key={conn.id} connection={conn} type="incoming" />)}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed rounded-xl bg-muted/10">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium">No pending requests</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                You're all caught up! Make sure your profile has skills listed to attract more connections.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="outgoing" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          {board.outgoing.length > 0 ? (
            <div className="grid gap-4">
              {board.outgoing.map(conn => <ConnectionCard key={conn.id} connection={conn} type="outgoing" />)}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed rounded-xl bg-muted/10">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium">No sent requests</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                You haven't sent any connection requests yet. Find a perfect match and start learning!
              </p>
              <Link href="/matches">
                <Button variant="outline">View Matches</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}