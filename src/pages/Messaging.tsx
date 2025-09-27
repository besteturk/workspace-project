import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, Phone, Video } from "lucide-react";

const Messaging = () => {
  const [selectedChat, setSelectedChat] = useState("alice");
  const [newMessage, setNewMessage] = useState("");

  const users = [
    { id: "alice", name: "Alice Johnson", initials: "AJ", status: "online", lastMessage: "Hey, can we review the project proposal?", time: "2m", unread: 2 },
    { id: "bob", name: "Bob Smith", initials: "BS", status: "away", lastMessage: "Thanks for the feedback!", time: "1h", unread: 0 },
    { id: "carol", name: "Carol Davis", initials: "CD", status: "online", lastMessage: "The design looks great 👍", time: "3h", unread: 1 },
    { id: "david", name: "David Wilson", initials: "DW", status: "offline", lastMessage: "Let's sync up tomorrow", time: "1d", unread: 0 },
  ];

  const messages = {
    alice: [
      { id: 1, sender: "alice", content: "Hey! How's the project coming along?", time: "10:30 AM", isOwn: false },
      { id: 2, sender: "me", content: "Going well! Just finished the initial draft", time: "10:32 AM", isOwn: true },
      { id: 3, sender: "alice", content: "That's awesome! Can we review it together?", time: "10:35 AM", isOwn: false },
      { id: 4, sender: "alice", content: "I have some ideas for improvements", time: "10:35 AM", isOwn: false },
      { id: 5, sender: "me", content: "Absolutely! When works for you?", time: "10:38 AM", isOwn: true },
    ],
    bob: [
      { id: 1, sender: "bob", content: "Thanks for the feedback on the design!", time: "9:15 AM", isOwn: false },
      { id: 2, sender: "me", content: "Happy to help! The new layout looks much better", time: "9:20 AM", isOwn: true },
    ],
    carol: [
      { id: 1, sender: "carol", content: "The design looks great 👍", time: "7:45 AM", isOwn: false },
    ],
    david: [
      { id: 1, sender: "david", content: "Let's sync up tomorrow about the roadmap", time: "Yesterday", isOwn: false },
    ],
  };

  const selectedUser = users.find(u => u.id === selectedChat);
  const chatMessages = messages[selectedChat as keyof typeof messages] || [];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-success";
      case "away": return "bg-accent";
      case "offline": return "bg-muted-foreground";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full gap-6">
        {/* Users List */}
        <div className="w-80">
          <Card className="shadow-card h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Messages
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat === user.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedChat(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-foreground truncate">{user.name}</h3>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">{user.time}</span>
                            {user.unread > 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 flex items-center justify-center">
                                {user.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <Card className="shadow-card mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {selectedUser.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(selectedUser.status)}`}></div>
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">{selectedUser.name}</h2>
                        <p className="text-sm text-muted-foreground capitalize">{selectedUser.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <Card className="shadow-card flex-1 flex flex-col">
                <CardContent className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="shadow-card flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Select a conversation</h3>
                <p className="text-muted-foreground">Choose from your existing conversations to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Messaging;