import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, CheckCheck, MessageSquare, Send, Search, Users } from "lucide-react";
import { api } from "@/services/api";
import type { ConversationParticipant, ConversationSummary, MessageSummary } from "@/services/api";
import { ApiError } from "@/lib/api";
import { getStoredUser, logout } from "@/lib/auth";

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const TIME_RANGES: Array<{ unit: Intl.RelativeTimeFormatUnit; minutes: number }> = [
   { unit: "year", minutes: 60 * 24 * 365 },
   { unit: "month", minutes: 60 * 24 * 30 },
   { unit: "week", minutes: 60 * 24 * 7 },
   { unit: "day", minutes: 60 * 24 },
   { unit: "hour", minutes: 60 },
   { unit: "minute", minutes: 1 },
];

function formatRelativeTime(timestamp?: string) {
   if (!timestamp) return "";

   const target = new Date(timestamp);
   if (Number.isNaN(target.getTime())) return "";

   const diffMinutes = Math.round((target.getTime() - Date.now()) / (1000 * 60));

   for (const range of TIME_RANGES) {
      if (Math.abs(diffMinutes) >= range.minutes || range.unit === "minute") {
         const value = diffMinutes / range.minutes;
         return relativeTimeFormat.format(Math.round(value), range.unit);
      }
   }

   return "Just now";
}

function formatMessageTime(timestamp?: string) {
   if (!timestamp) return "";
   const target = new Date(timestamp);
   if (Number.isNaN(target.getTime())) return "";
   return target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getParticipantName(participant: ConversationParticipant) {
   const name = `${participant.first_name ?? ""} ${participant.last_name ?? ""}`.trim();
   return name || participant.email || "Unknown";
}

function getDisplayParticipants(
   conversation: ConversationSummary,
   currentUserId?: number
): ConversationParticipant[] {
   return conversation.participants.filter((participant) => participant.user_id !== currentUserId);
}

function getConversationTitle(conversation: ConversationSummary, currentUserId?: number) {
   const title = conversation.title?.trim();
   if (title) return title;

   const others = getDisplayParticipants(conversation, currentUserId);
   const names = others.map(getParticipantName).filter(Boolean);
   if (names.length > 0) {
      return names.join(", ");
   }

   const fallbackNames = conversation.participants.map(getParticipantName).filter(Boolean);
   if (fallbackNames.length > 0) {
      return fallbackNames.join(", ");
   }

   return "Conversation";
}

function getConversationInitials(conversation: ConversationSummary, currentUserId?: number) {
   const title = getConversationTitle(conversation, currentUserId);
   const initials = title
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase())
      .join("")
      .slice(0, 2);

   return initials || "C";
}

function getConversationSubtitle(conversation: ConversationSummary, currentUserId?: number) {
   const descriptor = conversation.is_direct ? "Direct message" : "Group conversation";
   const names = getDisplayParticipants(conversation, currentUserId).map(getParticipantName);

   if (names.length === 0) {
      return descriptor;
   }

   return `${descriptor} • ${names.join(", ")}`;
}

const MESSAGE_RETRY_INTERVAL_MS = 5000;

const Messaging = () => {
   const navigate = useNavigate();
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
   const [conversations, setConversations] = useState<ConversationSummary[]>([]);
   const [messages, setMessages] = useState<MessageSummary[]>([]);
   const [newMessage, setNewMessage] = useState("");
   const [loadingConversations, setLoadingConversations] = useState(false);
   const [loadingMessages, setLoadingMessages] = useState(false);
   const [sendingMessage, setSendingMessage] = useState(false);
   const [conversationError, setConversationError] = useState<string | null>(null);
   const [messageError, setMessageError] = useState<string | null>(null);

   const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const controllerRef = useRef<AbortController | null>(null);

   const currentUser = useMemo(() => getStoredUser(), []);
   const currentUserId = currentUser?.user_id;

   useEffect(() => {
      return () => {
         controllerRef.current?.abort();
         if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
         }
      };
   }, []);

   useEffect(() => {
      const controller = new AbortController();

      const loadConversations = async () => {
         setLoadingConversations(true);
         setConversationError(null);

         try {
            const response = await api.messaging.listConversations({ signal: controller.signal });
            setConversations(response.conversations);

            if (response.conversations.length > 0) {
               setSelectedConversationId((previous) => {
                  if (previous && response.conversations.some((c) => c.conversation_id === previous)) {
                     return previous;
                  }
                  return response.conversations[0].conversation_id;
               });
            } else {
               setSelectedConversationId(null);
               setMessages([]);
            }
         } catch (error) {
            if (controller.signal.aborted) return;

            console.error("Failed to load conversations", error);
            if (error instanceof ApiError && error.status === 401) {
               logout();
               navigate("/login");
               return;
            }

            setConversationError(
               error instanceof ApiError ? error.message || "Failed to load conversations" : "Failed to load conversations"
            );
         } finally {
            if (!controller.signal.aborted) {
               setLoadingConversations(false);
            }
         }
      };

      loadConversations();

      return () => controller.abort();
   }, [navigate]);

   useEffect(() => {
      controllerRef.current?.abort();
      if (retryTimeoutRef.current) {
         clearTimeout(retryTimeoutRef.current);
         retryTimeoutRef.current = null;
      }

      if (selectedConversationId == null) {
         setMessages([]);
         return;
      }

      const fetchMessages = async (showLoader: boolean) => {
         controllerRef.current?.abort();
         const controller = new AbortController();
         controllerRef.current = controller;

         if (showLoader) {
            setLoadingMessages(true);
         }

         try {
            const response = await api.messaging.listMessages(selectedConversationId, {
               signal: controller.signal,
            });

            setMessages(response.messages);
            setConversations((previous) =>
               previous.map((conversation) =>
                  conversation.conversation_id === selectedConversationId
                     ? { ...conversation, unread_count: 0 }
                     : conversation
               )
            );
            setMessageError(null);

            if (retryTimeoutRef.current) {
               clearTimeout(retryTimeoutRef.current);
               retryTimeoutRef.current = null;
            }
         } catch (error) {
            if (controller.signal.aborted) {
               return;
            }

            console.error("Failed to load messages", error);
            if (error instanceof ApiError && error.status === 401) {
               logout();
               navigate("/login");
               return;
            }

            const fallbackMessage =
               error instanceof ApiError && error.message
                  ? `${error.message} Retrying in ${MESSAGE_RETRY_INTERVAL_MS / 1000}s...`
                  : `Failed to load messages. Retrying in ${MESSAGE_RETRY_INTERVAL_MS / 1000}s...`;

            setMessageError(fallbackMessage);

            retryTimeoutRef.current = setTimeout(() => {
               fetchMessages(false);
            }, MESSAGE_RETRY_INTERVAL_MS);
         } finally {
            if (!controller.signal.aborted) {
               setLoadingMessages(false);
            }
         }
      };

      fetchMessages(true);

      return () => {
         controllerRef.current?.abort();
         if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
         }
      };
   }, [selectedConversationId, navigate, setConversations]);

   const filteredConversations = useMemo(() => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return conversations;

      return conversations.filter((conversation) => {
         const title = getConversationTitle(conversation, currentUserId).toLowerCase();
         if (title.includes(term)) return true;

         return conversation.participants.some((participant) =>
            getParticipantName(participant).toLowerCase().includes(term)
         );
      });
   }, [searchTerm, conversations, currentUserId]);

   const selectedConversation = useMemo(() => {
      if (selectedConversationId == null) return null;
      return conversations.find((conversation) => conversation.conversation_id === selectedConversationId) ?? null;
   }, [conversations, selectedConversationId]);

   const outboundMessageReadStatus = useMemo(() => {
      const statusMap = new Map<number, boolean>();

      if (currentUserId == null) {
         return statusMap;
      }

      let hasReplyAfter = false;

      for (let index = messages.length - 1; index >= 0; index -= 1) {
         const message = messages[index];

         if (message.sender_id !== currentUserId) {
            hasReplyAfter = true;
            continue;
         }

         const computedRead = Boolean(message.is_read) || hasReplyAfter;
         statusMap.set(message.message_id, computedRead);
      }

      return statusMap;
   }, [messages, currentUserId]);

   const conversationTitle = selectedConversation
      ? getConversationTitle(selectedConversation, currentUserId)
      : "";
   const conversationSubtitle = selectedConversation
      ? getConversationSubtitle(selectedConversation, currentUserId)
      : "";

   const handleSendMessage = async (event?: React.FormEvent) => {
      event?.preventDefault();

      if (!newMessage.trim() || selectedConversationId == null) {
         return;
      }

      try {
         setSendingMessage(true);
         setMessageError(null);

         const response = await api.messaging.sendMessage(selectedConversationId, {
            content: newMessage.trim(),
         });

         setMessages(response.messages);
         setNewMessage("");

         try {
            const conversationsResponse = await api.messaging.listConversations();
            setConversations(conversationsResponse.conversations);
         } catch (conversationRefreshError) {
            console.error("Failed to refresh conversations", conversationRefreshError);
         }
      } catch (error) {
         console.error("Failed to send message", error);
         if (error instanceof ApiError && error.status === 401) {
            logout();
            navigate("/login");
            return;
         }

         setMessageError(error instanceof ApiError ? error.message || "Failed to send message" : "Failed to send message");
      } finally {
         setSendingMessage(false);
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
                           value={searchTerm}
                           onChange={(event) => setSearchTerm(event.target.value)}
                           className="pl-10"
                        />
                     </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-0">
                     <ScrollArea className="h-full">
                        <div className="space-y-2 p-4">
                           {loadingConversations && conversations.length === 0 ? (
                              <p className="py-8 text-center text-sm text-muted-foreground">
                                 Loading conversations...
                              </p>
                           ) : filteredConversations.length === 0 ? (
                              <p className="py-8 text-center text-sm text-muted-foreground">
                                 No conversations found.
                              </p>
                           ) : (
                              filteredConversations.map((conversation) => {
                                 const isSelected = conversation.conversation_id === selectedConversationId;
                                 const initials = getConversationInitials(conversation, currentUserId);
                                 const name = getConversationTitle(conversation, currentUserId);
                                 const lastMessageContent = conversation.last_message?.content ?? "No messages yet";
                                 const lastMessageTime = formatRelativeTime(conversation.last_message?.created_at);
                                 const hasUnread = conversation.unread_count > 0;
                                 const nameClasses = hasUnread
                                    ? "text-sm font-semibold text-foreground"
                                    : "text-sm font-medium text-foreground";
                                 const previewClasses = hasUnread
                                    ? "text-sm break-words text-foreground"
                                    : "text-sm break-words text-muted-foreground";
                                 const metaClasses = `flex items-center gap-2 text-xs ${hasUnread ? "text-foreground" : "text-muted-foreground"}`;

                                 return (
                                    <button
                                       key={conversation.conversation_id}
                                       type="button"
                                       onClick={() => {
                                          setSelectedConversationId(conversation.conversation_id);
                                          setMessageError(null);
                                       }}
                                       className={`w-full rounded-xl px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isSelected
                                          ? "bg-primary/10 shadow-sm ring-1 ring-primary/30"
                                          : "ring-1 ring-transparent hover:bg-muted/40 hover:ring-border"
                                          }`}
                                    >
                                       <div className="flex items-start gap-3">
                                          <div className="relative">
                                             <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                   {initials}
                                                </AvatarFallback>
                                             </Avatar>
                                             {!conversation.is_direct && (
                                                <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                                                   <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                                                </span>
                                             )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                             <div className="mb-1 flex items-start justify-between gap-2">
                                                <h3 className={nameClasses}>{name}</h3>
                                                <div className={metaClasses}>
                                                   {lastMessageTime && (
                                                      <span className="whitespace-nowrap">{lastMessageTime}</span>
                                                   )}
                                                   {conversation.unread_count > 0 && (
                                                      <Badge className="flex h-5 min-w-[20px] items-center justify-center bg-primary text-[11px] text-primary-foreground">
                                                         {conversation.unread_count}
                                                      </Badge>
                                                   )}
                                                </div>
                                             </div>
                                             <p className={previewClasses}>{lastMessageContent}</p>
                                          </div>
                                       </div>
                                    </button>
                                 );
                              })
                           )}
                           {conversationError && (
                              <p className="text-center text-xs text-destructive">{conversationError}</p>
                           )}
                        </div>
                     </ScrollArea>
                  </CardContent>
               </Card>
            </div>

            {/* Chat Area */}
            <div className="flex min-h-0 flex-1 flex-col gap-6">
               {selectedConversation ? (
                  <div className="flex h-full min-h-0 flex-col gap-6">
                     {/* Chat Header */}
                     <Card className="shadow-card">
                        <CardContent className="flex items-center justify-between gap-4 p-4">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                 <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                                    {getConversationInitials(selectedConversation, currentUserId)}
                                 </AvatarFallback>
                              </Avatar>
                              <div>
                                 <h2 className="text-lg font-semibold text-foreground">
                                    {conversationTitle}
                                 </h2>
                                 <p className="text-sm text-muted-foreground">{conversationSubtitle}</p>
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Messages */}
                     <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
                        <ScrollArea className="flex-1">
                           <div className="space-y-4 px-4 py-6">
                              {loadingMessages && messages.length === 0 ? (
                                 <p className="text-center text-sm text-muted-foreground">
                                    Loading messages...
                                 </p>
                              ) : messages.length === 0 ? (
                                 <p className="text-center text-sm text-muted-foreground">
                                    No messages yet. Start the conversation!
                                 </p>
                              ) : (
                                 messages.map((message) => {
                                    const isOwn = currentUserId != null && message.sender_id === currentUserId;
                                    const isUnread = !isOwn && message.is_read === false;
                                    const computedIsRead = isOwn
                                       ? outboundMessageReadStatus.get(message.message_id) ?? Boolean(message.is_read)
                                       : Boolean(message.is_read);
                                    const readTooltip = computedIsRead ? "Read" : "Delivered";
                                    const bubbleClasses = `max-w-[75%] break-words rounded-2xl px-4 py-2 text-sm ${isOwn
                                       ? "bg-primary text-primary-foreground"
                                       : isUnread
                                          ? "bg-primary/10 text-foreground border border-primary/40"
                                          : "bg-card text-foreground border border-border"
                                       }`;
                                    const metadataClasses = `mt-1 flex items-center gap-1 text-xs ${isOwn
                                       ? "justify-end text-primary-foreground/80"
                                       : "justify-start text-muted-foreground"
                                       }`;

                                    return (
                                       <div
                                          key={message.message_id}
                                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                       >
                                          <div className={bubbleClasses}>
                                             <p>{message.content}</p>
                                             <div className={metadataClasses}>
                                                <span>{formatMessageTime(message.created_at)}</span>
                                                {isOwn ? (
                                                   <span
                                                      className="inline-flex items-center"
                                                      title={readTooltip}
                                                   >
                                                      {computedIsRead ? (
                                                         <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                                      ) : (
                                                         <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                                      )}
                                                   </span>
                                                ) : (
                                                   isUnread && (
                                                      <span className="inline-flex items-center" title="New message">
                                                         <span className="inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                                                         <span className="sr-only">Unread message</span>
                                                      </span>
                                                   )
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    );
                                 })
                              )}
                              {messageError && (
                                 <p className="text-center text-xs text-destructive">{messageError}</p>
                              )}
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
                                 onChange={(event) => setNewMessage(event.target.value)}
                                 className="flex-1"
                                 disabled={sendingMessage}
                              />
                              <Button
                                 type="submit"
                                 disabled={!newMessage.trim() || sendingMessage}
                                 className="bg-primary hover:bg-primary/90"
                              >
                                 {sendingMessage ? (
                                    <span className="text-xs">Sending...</span>
                                 ) : (
                                    <Send className="h-4 w-4" />
                                 )}
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
