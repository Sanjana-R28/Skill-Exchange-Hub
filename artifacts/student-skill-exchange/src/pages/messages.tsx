import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useListMessages, 
  getListMessagesQueryKey, 
  useSendMessage,
  useGetCurrentUser,
  useListConnections
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Loader2, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Messages() {
  const params = useParams();
  const userId = params.userId ? parseInt(params.userId, 10) : 0;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messageText, setMessageText] = useState("");

  const { data: auth } = useGetCurrentUser({ query: { retry: false } });
  
  // We need connection info to show user details in the header
  const { data: board } = useListConnections({ query: { enabled: !!userId } });
  
  const { data: messages, isLoading } = useListMessages(userId, {
    query: {
      queryKey: getListMessagesQueryKey(userId),
      enabled: !!userId,
      refetchInterval: 3000 // Poll for new messages
    }
  });

  const sendMessage = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !userId) return;

    const currentText = messageText;
    setMessageText("");

    sendMessage.mutate(
      { userId, data: { message: currentText } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(userId) });
        },
        onError: () => {
          // Revert if failed
          setMessageText(currentText);
        }
      }
    );
  };

  if (!userId) return <div>Invalid User ID</div>;

  if (isLoading || !auth?.user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Find the other user details from accepted connections
  const connection = board?.accepted.find(c => c.otherUser.id === userId);
  const otherUser = connection?.otherUser;
  const currentUser = auth.user;

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] max-w-4xl mx-auto border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b bg-card z-10 shrink-0">
        <Link href="/connections">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        
        {otherUser ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={otherUser.profilePicture} />
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(otherUser.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{otherUser.name}</h3>
              <p className="text-xs text-muted-foreground">{otherUser.college} • {otherUser.branch}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 relative">
        {!connection && !isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="bg-card p-6 rounded-xl border shadow-lg text-center max-w-sm">
              <Info className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Not Connected</h3>
              <p className="text-sm text-muted-foreground mb-4">You can only message users who have accepted your connection request.</p>
              <Link href="/connections">
                <Button>Go to Connections</Button>
              </Link>
            </div>
          </div>
        )}

        {messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary/40" />
            </div>
            <p className="font-medium text-foreground">Start the conversation</p>
            <p className="text-sm mt-1 text-center max-w-xs">
              Say hi, ask about their skills, or figure out a time to meet up on campus.
            </p>
          </div>
        ) : (
          messages?.map((msg, index) => {
            const isMe = msg.senderId === currentUser.id;
            const msgDate = new Date(msg.timestamp);
            
            // Show date separator if it's the first message or if it's a new day
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDateSeparator = !prevMsg || 
              format(new Date(prevMsg.timestamp), 'yyyy-MM-dd') !== format(msgDate, 'yyyy-MM-dd');

            return (
              <div key={msg.id} className="flex flex-col">
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      {format(msgDate, 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
                
                <div className={`flex w-full mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex max-w-[75%] gap-2 items-end">
                    {!isMe && (
                      <Avatar className="h-6 w-6 shrink-0 mb-1">
                        <AvatarImage src={otherUser?.profilePicture} />
                        <AvatarFallback className="text-[10px] bg-primary/10">{getInitials(otherUser?.name || "?")}</AvatarFallback>
                      </Avatar>
                    )}
                    <div 
                      className={`px-4 py-2.5 rounded-2xl ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-card border border-border shadow-sm rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(msgDate, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-card shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <Input 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 rounded-full h-11 px-4 bg-muted/50 focus-visible:bg-background"
            disabled={!connection || sendMessage.isPending}
            autoComplete="off"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-11 w-11 rounded-full shrink-0 shadow-sm"
            disabled={!messageText.trim() || !connection || sendMessage.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </Card>
  );
}