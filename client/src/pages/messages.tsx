import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useWallet } from "../hooks/use-wallet";
import { useWebSocketContext } from "../components/WebSocketProvider";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistance } from "date-fns";
import { useToast } from "../hooks/use-toast";

interface User {
  id: number;
  username: string;
  profilePic?: string;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  id: number;
  lastMessageAt: string;
  createdAt: string;
  participants?: User[];
  lastMessage?: {
    text: string;
    createdAt: string;
    read: boolean;
  };
}

export default function Messages() {
  const { user } = useWallet();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocketContext();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch conversations for the current user
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await apiRequest({
        url: `/api/conversations?userId=${user.id}`,
        method: "GET"
      });
      
      // Enrich conversations with participant data
      const enrichedConversations = await Promise.all(
        response.map(async (conversation: Conversation) => {
          // Get participants
          const participantsResponse = await apiRequest({
            url: `/api/conversations/${conversation.id}/participants`,
            method: "GET"
          });
          
          // Get last message
          const messagesResponse = await apiRequest({
            url: `/api/conversations/${conversation.id}/messages`,
            method: "GET"
          });
          
          const lastMessage = messagesResponse.length > 0 ? messagesResponse[messagesResponse.length - 1] : null;
          
          return {
            ...conversation,
            participants: participantsResponse,
            lastMessage: lastMessage ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              read: lastMessage.read
            } : null
          };
        })
      );
      
      return enrichedConversations;
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Auto-refresh conversations every 5 seconds
    staleTime: 3000      // Consider data stale after 3 seconds
  });
  
  // Fetch messages for the selected conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      
      const response = await apiRequest({
        url: `/api/conversations/${selectedConversation.id}/messages`,
        method: "GET"
      });
      
      return response;
    },
    enabled: !!selectedConversation?.id
  });
  
  // Create new message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (messageData: { conversationId: number, senderId: number, text: string }) => {
      const response = await apiRequest({
        url: "/api/messages",
        method: "POST",
        data: messageData
      });
      
      return response;
    },
    onSuccess: (newMessage) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', user?.id] });
      
      // Send WebSocket message
      sendMessage({
        type: "new_message",
        message: newMessage,
        recipientId: getRecipientId()
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Get the recipient user (the other participant in the conversation)
  const getRecipient = (): User | undefined => {
    if (!selectedConversation?.participants || !user) return undefined;
    
    return selectedConversation.participants.find(p => p.id !== user.id);
  };
  
  // Get recipient ID 
  const getRecipientId = (): number => {
    const recipient = getRecipient();
    return recipient?.id || 0;
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation || !user) return;
    
    createMessageMutation.mutate({
      conversationId: selectedConversation.id,
      senderId: user.id,
      text: messageText.trim()
    });
    
    setMessageText('');
  };
  
  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!selectedConversation?.id || !user?.id) return;
    
    const unreadMessages = messages.filter(
      (msg: Message) => !msg.read && msg.senderId !== user.id
    );
    
    if (unreadMessages.length === 0) return;
    
    // Mark each unread message as read
    for (const message of unreadMessages) {
      try {
        await apiRequest({
          url: `/api/messages/${message.id}/read`,
          method: "PATCH"
        });
        
        // Send WebSocket notification
        sendMessage({
          type: "message_read",
          messageId: message.id
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
    
    // Refresh conversations to update unread status
    refetchConversations();
  };
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    if (lastMessage.type === "new_message") {
      console.log("Received WebSocket message in Messages page:", lastMessage);
      
      // Refetch messages if the new message belongs to the current conversation
      if (selectedConversation?.id === lastMessage.message.conversationId) {
        refetchMessages();
        markMessagesAsRead();
      }
      
      // Always refetch conversations to update the list with new messages
      refetchConversations();
    } else if (lastMessage.type === "message_sent") {
      console.log("Message sent confirmation received:", lastMessage);
      // Refetch conversations to show the new message in the sidebar
      refetchConversations();
    } else if (lastMessage.type === "message_read") {
      // Refetch messages to update read status
      if (selectedConversation) {
        refetchMessages();
      }
    }
  }, [lastMessage, selectedConversation?.id, refetchMessages, refetchConversations, markMessagesAsRead]);
  
  // Scroll to bottom of messages when new messages arrive or conversation changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Mark messages as read when conversation is selected
    if (selectedConversation) {
      markMessagesAsRead();
    }
  }, [messages, selectedConversation]);
  
  // Format timestamp for display
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, "h:mm a");
    }
    
    return formatDistance(date, now, { addSuffix: true });
  };
  
  // Check if user is connected
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
          <p className="text-muted">You need to connect your wallet to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="messages" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow flex h-[70vh]">
            {/* Conversations sidebar */}
            <div className="w-1/3 border-r border-border">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-bold">Messages</h2>
                {connectionStatus === 'open' ? (
                  <span className="text-xs text-green-500">Connected</span>
                ) : (
                  <span className="text-xs text-amber-500">{connectionStatus}...</span>
                )}
              </div>
              
              <div className="overflow-y-auto h-[calc(70vh-60px)]">
                {conversationsLoading ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation: Conversation) => {
                    const otherParticipant = conversation.participants?.find(p => p.id !== user.id);
                    const hasUnread = conversation.lastMessage && 
                      !conversation.lastMessage.read && 
                      messages.find((m: Message) => m.senderId !== user.id);
                      
                    return (
                      <div 
                        key={conversation.id}
                        className={`p-4 flex items-center border-b border-border hover:bg-secondary cursor-pointer ${
                          selectedConversation?.id === conversation.id ? 'bg-secondary' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="relative">
                          <img 
                            src={otherParticipant?.profilePic || "/default-avatar.png"} 
                            alt={otherParticipant?.username || "User"} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          {hasUnread && (
                            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-primary rounded-full"></span>
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium truncate">
                              {otherParticipant?.username || "User"}
                            </p>
                            {conversation.lastMessageAt && (
                              <span className="text-xs text-muted">
                                {formatMessageTime(conversation.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted truncate">
                              {conversation.lastMessage.text}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Message area */}
            <div className="w-2/3 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-border flex items-center">
                    {getRecipient() ? (
                      <>
                        <img 
                          src={getRecipient()?.profilePic || "/default-avatar.png"} 
                          alt={getRecipient()?.username || "User"} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <p className="ml-3 text-sm font-medium">{getRecipient()?.username || "User"}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium">Loading...</p>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        {messages.map((message: Message) => {
                          const isFromCurrentUser = message.senderId === user.id;
                          
                          return (
                            <div key={message.id} className={`flex ${isFromCurrentUser ? 'justify-end' : ''}`}>
                              <div 
                                className={`${
                                  isFromCurrentUser 
                                    ? 'bg-primary text-white rounded-xl rounded-tr-none' 
                                    : 'bg-secondary rounded-xl rounded-tl-none'
                                } p-3 max-w-[70%]`}
                              >
                                <p className="text-sm">{message.text}</p>
                                <span 
                                  className={`text-xs ${
                                    isFromCurrentUser ? 'text-primary-foreground' : 'text-muted'
                                  } mt-1 block`}
                                >
                                  {formatMessageTime(message.createdAt)}
                                  {isFromCurrentUser && (
                                    <span className="ml-2">
                                      {message.read ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center">
                      <textarea 
                        className="flex-1 px-4 py-2 border border-border rounded-full bg-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none h-10 max-h-32 overflow-hidden"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={createMessageMutation.isPending}
                      />
                      <button 
                        className={`ml-3 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center ${
                          createMessageMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={handleSendMessage}
                        disabled={createMessageMutation.isPending}
                      >
                        {createMessageMutation.isPending ? (
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-1">Your Messages</h3>
                    <p className="text-sm text-muted">
                      {conversations.length === 0 
                        ? "You don't have any conversations yet" 
                        : "Select a conversation to start chatting"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}