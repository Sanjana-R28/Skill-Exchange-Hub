import { useEffect, useMemo, useRef, useState } from "react";
import {
  getListConnectionsQueryKey,
  getListMessagesQueryKey,
  useGetCurrentUser,
  useListConnections,
  useListMessages,
  useSendMessage,
} from "@workspace/api-client-react";
import type { Connection } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageContent } from "@/components/message-content";
import { MessageSquare, Send, Users, Video } from "lucide-react";

export default function Chat() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: auth } = useGetCurrentUser({ query: { retry: false } });
  const { data: board, isLoading: isLoadingConnections } = useListConnections({
    query: {
      queryKey: getListConnectionsQueryKey(),
      refetchInterval: 10000,
    },
  });

  const acceptedConnections = board?.accepted ?? [];

  useEffect(() => {
    if (!selectedUserId && acceptedConnections.length > 0) {
      setSelectedUserId(acceptedConnections[0].otherUser.id);
    }
  }, [acceptedConnections, selectedUserId]);

  const selectedConnection = useMemo(
    () => acceptedConnections.find((connection) => connection.otherUser.id === selectedUserId),
    [acceptedConnections, selectedUserId],
  );

  const selectedUser = selectedConnection?.otherUser;

  const { data: messages, isLoading: isLoadingMessages } = useListMessages(selectedUserId ?? 0, {
    query: {
      queryKey: getListMessagesQueryKey(selectedUserId ?? 0),
      enabled: Boolean(selectedUserId),
      refetchInterval: 3000,
    },
  });

  const sendMessage = useSendMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUserId]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId || !messageText.trim()) {
      return;
    }
    const text = messageText.trim();
    setMessageText("");
    sendMessage.mutate(
      { userId: selectedUserId, data: { message: text } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(selectedUserId) });
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
        },
        onError: () => {
          setMessageText(text);
        },
      },
    );
  };

  const sendMeetLink = () => {
    if (!selectedUserId || !selectedConnection || sendMessage.isPending) {
      return;
    }
    const low = Math.min(selectedConnection.senderId, selectedConnection.receiverId);
    const high = Math.max(selectedConnection.senderId, selectedConnection.receiverId);
    const text = `Join my Google Meet study session: https://meet.new\nRoom note: skillx-study-${low}-${high}`;
    sendMessage.mutate(
      { userId: selectedUserId, data: { message: text } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(selectedUserId) });
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
        },
      },
    );
  };

  const ConnectionButton = ({ connection }: { connection: Connection }) => {
    const user = connection.otherUser;
    const isSelected = user.id === selectedUserId;
    return (
      <button
        type="button"
        onClick={() => setSelectedUserId(user.id)}
        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
          isSelected
            ? "border-primary bg-primary/10 shadow-sm"
            : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
        }`}
      >
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={user.profilePicture} />
          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.branch}</p>
        </div>
      </button>
    );
  };

  if (isLoadingConnections || !auth?.user) {
    return (
      <div className="h-[70vh] grid place-items-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Box</h1>
          <p className="text-muted-foreground mt-1">Chat with students after both of you are connected.</p>
        </div>
        {selectedUser && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={sendMeetLink} disabled={sendMessage.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Send Meet Link
            </Button>
            <Link href={`/study-room/${selectedUser.id}`}>
              <Button variant="outline" className="rounded-full">
                <Video className="h-4 w-4 mr-2" />
                Open Study Meet
              </Button>
            </Link>
          </div>
        )}
      </div>

      {acceptedConnections.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
          <h3 className="text-xl font-semibold">No accepted connections yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">
            Accept a request or connect with a match before starting a chat.
          </p>
          <Link href="/connections">
            <Button>Go to Connections</Button>
          </Link>
        </Card>
      ) : (
        <Card className="grid md:grid-cols-[280px_1fr] h-[calc(100vh-12rem)] min-h-[560px] overflow-hidden border-border shadow-sm">
          <aside className="border-r bg-muted/20 p-4 overflow-y-auto space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Connected students
            </p>
            {acceptedConnections.map((connection) => (
              <ConnectionButton key={connection.id} connection={connection} />
            ))}
          </aside>

          <section className="flex flex-col min-w-0">
            {selectedUser ? (
              <>
                <div className="border-b p-4 flex items-center justify-between gap-3 bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-11 w-11 border">
                      <AvatarImage src={selectedUser.profilePicture} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(selectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate">{selectedUser.name}</h2>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedUser.college} • {selectedUser.branch}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                  {isLoadingMessages ? (
                    <div className="h-full grid place-items-center">
                      <div className="animate-spin w-7 h-7 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    messages.map((message) => {
                      const isMe = message.senderId === auth.user?.id;
                      return (
                        <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-card border border-border rounded-bl-sm"
                            }`}
                          >
                            <MessageContent text={message.message} isMine={isMe} />
                            <p className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(message.timestamp), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <MessageSquare className="h-12 w-12 text-primary/30 mb-4" />
                      <h3 className="font-semibold">Start this chat</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Plan what to learn, share your availability, or jump into a study meet.
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="border-t p-4 bg-card flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder={`Message ${selectedUser.name}...`}
                    className="h-11 rounded-full bg-muted/50 focus-visible:bg-background"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-11 w-11 rounded-full shrink-0"
                    disabled={!messageText.trim() || sendMessage.isPending}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </>
            ) : null}
          </section>
        </Card>
      )}
    </div>
  );
}