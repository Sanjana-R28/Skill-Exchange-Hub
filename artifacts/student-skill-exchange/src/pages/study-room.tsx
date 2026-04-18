import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { getListMessagesQueryKey, useListConnections, useSendMessage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CalendarDays, Copy, ExternalLink, MessageSquare, Send, Video } from "lucide-react";

export default function StudyRoom() {
  const params = useParams();
  const userId = params.userId ? Number(params.userId) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: board, isLoading } = useListConnections({ query: { enabled: Boolean(userId) } });
  const sendMessage = useSendMessage();

  const connection = board?.accepted.find((item) => item.otherUser.id === userId);
  const user = connection?.otherUser;

  const roomName = useMemo(() => {
    if (!connection) {
      return "";
    }
    const low = Math.min(connection.senderId, connection.receiverId);
    const high = Math.max(connection.senderId, connection.receiverId);
    return `skillx-study-${low}-${high}`;
  }, [connection]);

  const meetUrl = "https://meet.new";
  const inviteText = user
    ? `Join my Google Meet study session: ${meetUrl}\nRoom note: ${roomName}`
    : "";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteText);
    toast({ title: "Study meet invite copied" });
  };

  const sendInvite = () => {
    if (!userId || !inviteText || sendMessage.isPending) {
      return;
    }
    sendMessage.mutate(
      { userId, data: { message: inviteText } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(userId) });
          toast({ title: "Study meet link sent in chat" });
        },
        onError: () => {
          toast({ title: "Could not send meet link", variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] grid place-items-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-xl mx-auto mt-10 border-dashed">
        <CardContent className="py-12 text-center">
          <Video className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-4" />
          <h1 className="text-2xl font-bold">Study Meet unavailable</h1>
          <p className="text-muted-foreground mt-2 mb-6">
            Video study rooms are available only for accepted connections.
          </p>
          <Link href="/connections">
            <Button>Back to Connections</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <Link href="/connections">
        <Button variant="ghost" className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to connections
        </Button>
      </Link>

      <Card className="overflow-hidden border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/15 via-card to-chart-2/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">Study Meet with {user.name}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Use this room when distance makes an in-person session difficult.
                </p>
              </div>
            </div>
            <a href={meetUrl} target="_blank" rel="noreferrer">
              <Button className="rounded-full shadow-sm">
                <Video className="h-4 w-4 mr-2" />
                Start Google Meet
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </CardHeader>

        <CardContent className="p-6 grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-2xl border bg-muted/20 p-5">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              How to use this study room
            </h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>1. Message your connection and agree on a time.</p>
              <p>2. Click Start Google Meet to create a live study call.</p>
              <p>3. Copy the invite below and send it in chat so both people join the same session.</p>
            </div>
            <div className="mt-5 rounded-xl bg-card border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invite message</p>
              <p className="text-sm mt-2 break-words">{inviteText}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
            <Button onClick={copyInvite} variant="outline" className="justify-start rounded-full">
              <Copy className="h-4 w-4 mr-2" />
              Copy invite
            </Button>
            <Button onClick={sendInvite} variant="outline" className="justify-start rounded-full" disabled={sendMessage.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Send meet link
            </Button>
            <Link href={`/messages/${user.id}`}>
              <Button variant="outline" className="w-full justify-start rounded-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Open chat
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="secondary" className="w-full justify-start rounded-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat box
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}