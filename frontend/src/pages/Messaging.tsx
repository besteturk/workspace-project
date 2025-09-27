import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Search, Phone, Video } from "lucide-react";

const Messaging = () => {
   const [selectedChat, setSelectedChat] = useState("alice");
   const [newMessage, setNewMessage] = useState("");

   const users = [
      {
         id: "alice",
         name: "Alice Johnson",
         initials: "AJ",
         status: "online",
         lastMessage: "Hey, can we review the project proposal?",
         time: "2m",
         unread: 2,
      },
      {
         id: "bob",
         name: "Bob Smith",
         initials: "BS",
         status: "away",
         lastMessage: "Thanks for the feedback!",
         time: "1h",
         unread: 0,
      },
      {
         id: "carol",
         name: "Carol Davis",
         initials: "CD",
         status: "online",
         lastMessage: "The design looks great 👍",
         time: "3h",
         unread: 1,
      },
      {
         id: "david",
         name: "David Wilson",
         initials: "DW",
         status: "offline",
         lastMessage: "Let's sync up tomorrow",
         time: "1d",
         unread: 0,
      },
   ];

   const messages = {
      alice: [
         {
            id: 1,
            sender: "alice",
            content: "Hey! How's the project coming along?",
            time: "10:30 AM",
            isOwn: false,
         },
         {
            id: 2,
            sender: "me",
            content: "Going well! Just finished the initial draft",
            time: "10:32 AM",
            isOwn: true,
         },
         {
            id: 3,
            sender: "alice",
            content: "That's awesome! Can we review it together?",
            time: "10:35 AM",
            isOwn: false,
         },
         {
            id: 4,
            sender: "alice",
            content: "I have some ideas for improvements",
            time: "10:35 AM",
            isOwn: false,
         },
         {
            id: 5,
            sender: "me",
            content: "Absolutely! When works for you?",
            time: "10:38 AM",
            isOwn: true,
         },
      ],
      bob: [
         {
            id: 1,
            sender: "bob",
            content: "Thanks for the feedback on the design!",
            time: "9:15 AM",
            isOwn: false,
         },
         {
            id: 2,
            sender: "me",
            content: "Happy to help! The new layout looks much better",
            time: "9:20 AM",
            isOwn: true,
         },
      ],
      carol: [
         {
            id: 1,
            sender: "carol",
            content: "The design looks great 👍",
            time: "7:45 AM",
            isOwn: false,
         },
      ],
      david: [
         {
            id: 1,
            sender: "david",
            content: "Let's sync up tomorrow about the roadmap",
            time: "Yesterday",
            isOwn: false,
         },
      ],
   };

   const selectedUser = users.find((u) => u.id === selectedChat);
   const chatMessages = messages[selectedChat as keyof typeof messages] || [];

   const handleSendMessage = (event?: React.FormEvent) => {
      event?.preventDefault();
      if (newMessage.trim()) {
         console.log("Sending message:", newMessage);
         setNewMessage("");
      }
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case "online":
            return "bg-success";
         case "away":
            return "bg-accent";
         case "offline":
            return "bg-muted-foreground";
         default:
            return "bg-muted-foreground";
      }
   };

   return (
      <AppLayout>
         <div className="flex h-full min-h-0 gap-6">
            {/* Users List */}
            <div className="hidden w-80 min-h-0 flex-col lg:flex">
               <Card className="flex h-full min-h-0 flex-col overflow-hidden shadow-card">
                  <CardHeader className="space-y-4 pb-4">
                     <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Messages
                     </CardTitle>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                           placeholder="Search conversations..."
                           className="pl-10"
                        />
                     </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-0">
                     <ScrollArea className="h-full">
                        <div className="space-y-2 p-4">
                           {users.map((user) => (
                              <button
                                 key={user.id}
                                 type="button"
                                 onClick={() => setSelectedChat(user.id)}
                                 className={`w-full rounded-xl px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                    selectedChat === user.id
                                       ? "bg-primary/10 shadow-sm ring-1 ring-primary/30"
                                       : "ring-1 ring-transparent hover:bg-muted/40 hover:ring-border"
                                 }`}
                              >
                                 <div className="flex items-start gap-3">
                                    <div className="relative">
                                       <Avatar className="h-10 w-10">
                                          <AvatarFallback className="bg-primary text-primary-foreground">
                                             {user.initials}
                                          </AvatarFallback>
                                       </Avatar>
                                       <span
                                          className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-card ${getStatusColor(
                                             user.status
                                          )}`}
                                       />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <div className="mb-1 flex items-start justify-between gap-2">
                                          <h3 className="text-sm font-medium text-foreground">
                                             {user.name}
                                          </h3>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                             <span className="whitespace-nowrap">{user.time}</span>
                                             {user.unread > 0 && (
                                                <Badge className="flex h-5 min-w-[20px] items-center justify-center bg-primary text-[11px] text-primary-foreground">
                                                   {user.unread}
                                                </Badge>
                                             )}
                                          </div>
                                       </div>
                                       <p className="text-sm text-muted-foreground break-words">
                                          {user.lastMessage}
                                       </p>
                                    </div>
                                 </div>
                              </button>
                           ))}
                        </div>
                     </ScrollArea>
                  </CardContent>
               </Card>
            </div>

            {/* Chat Area */}
            <div className="flex min-h-0 flex-1 flex-col gap-6">
               {selectedUser ? (
                  <div className="flex h-full min-h-0 flex-col gap-6">
                     {/* Chat Header */}
                     <Card className="shadow-card">
                        <CardContent className="flex items-center justify-between gap-4 p-4">
                           <div className="flex items-center gap-3">
                              <div className="relative">
                                 <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                                       {selectedUser.initials}
                                    </AvatarFallback>
                                 </Avatar>
                                 <span
                                    className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card ${getStatusColor(
                                       selectedUser.status
                                    )}`}
                                 />
                              </div>
                              <div>
                                 <h2 className="text-lg font-semibold text-foreground">
                                    {selectedUser.name}
                                 </h2>
                                 <p className="text-sm capitalize text-muted-foreground">
                                    {selectedUser.status}
                                 </p>
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Messages */}
                     <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
                        <ScrollArea className="flex-1">
                           <div className="space-y-4 px-4 py-6">
                              {chatMessages.map((message) => (
                                 <div
                                    key={message.id}
                                    className={`flex ${
                                       message.isOwn ? "justify-end" : "justify-start"
                                    }`}
                                 >
                                    <div
                                       className={`max-w-[75%] break-words rounded-2xl px-4 py-2 text-sm ${
                                          message.isOwn
                                             ? "bg-primary text-primary-foreground"
                                             : "bg-card border border-border"
                                       }`}
                                    >
                                       <p>{message.content}</p>
                                       <p
                                          className={`mt-1 text-xs ${
                                             message.isOwn
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                          }`}
                                       >
                                          {message.time}
                                       </p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="border-t border-border bg-card p-4">
                           <form
                              onSubmit={handleSendMessage}
                              className="flex items-center gap-2"
                           >
                              <Input
                                 placeholder="Type a message..."
                                 value={newMessage}
                                 onChange={(e) => setNewMessage(e.target.value)}
                                 className="flex-1"
                              />
                              <Button
                                 type="submit"
                                 disabled={!newMessage.trim()}
                                 className="bg-primary hover:bg-primary/90"
                              >
                                 <Send className="h-4 w-4" />
                              </Button>
                           </form>
                        </div>
                     </Card>
                  </div>
               ) : (
                  <Card className="flex flex-1 items-center justify-center shadow-card">
                     <div className="max-w-sm text-center">
                        <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-foreground">
                           Select a conversation
                        </h3>
                        <p className="text-sm text-muted-foreground">
                           Choose from your existing conversations to start messaging
                        </p>
                     </div>
                  </Card>
               )}
            </div>
         </div>
      </AppLayout>
   );
};

export default Messaging;
