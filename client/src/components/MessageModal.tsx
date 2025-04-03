import React, { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FaPaperPlane, FaSpinner } from "react-icons/fa";
import { useWebSocketContext } from "./WebSocketProvider";
import { useWallet } from "../hooks/use-wallet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  text?: string; // For API compatibility
  createdAt: string;
  read: boolean;
}

interface User {
  id: number;
  username: string;
  profilePic?: string;
}

interface MessageModalProps {
  recipientUser: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageModal({ recipientUser, isOpen, onClose }: MessageModalProps) {
  const [messageText, setMessageText] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocketContext();
  const { user: currentUser } = useWallet();
  const queryClient = useQueryClient();
  
  // Get or create conversation
  const { isLoading: isConversationLoading } = useQuery({
    queryKey: ["conversation", currentUser?.id, recipientUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !recipientUser?.id) return null;
      
      try {
        // Try to find existing conversation
        const response = await apiRequest({
          url: `/api/conversations`,
          method: "POST",
          data: {
            user1Id: currentUser.id,
            user2Id: recipientUser.id
          }
        });
        
        setConversationId(response.id);
        return response;
      } catch (error) {
        console.error("Error fetching conversation:", error);
        toast({
          title: "Error",
          description: "Could not load the conversation. Please try again.",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: isOpen && !!currentUser?.id && !!recipientUser?.id
  });
  
  // Get messages for conversation
  const { isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      try {
        const response = await apiRequest({
          url: `/api/conversations/${conversationId}/messages`,
          method: "GET"
        });
        
        setMessages(response);
        return response;
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Could not load messages. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!conversationId
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !currentUser?.id) {
        throw new Error("Missing conversation or user");
      }
      
      return apiRequest({
        url: "/api/messages",
        method: "POST",
        data: {
          conversationId,
          senderId: currentUser.id,
          text: content, // Changed content to text to match schema
          read: false
        }
      });
    },
    onSuccess: (data) => {
      // Instead of directly adding to state, check if the message already exists
      setMessages(prev => {
        // Check if the message already exists in our state
        const messageExists = prev.some(m => m.id === data.id);
        if (messageExists) {
          return prev; // Don't add duplicate
        }
        return [...prev, data]; // Add only if it doesn't exist
      });
      
      // Send WebSocket notification to recipient
      // The recipient will get the message via WebSocket notification
      // This WebSocket message will go to the server which will relay it to the recipient
      sendMessage({
        type: "new_message",
        senderId: currentUser?.id,
        recipientId: recipientUser?.id,
        message: data
      });
      
      // Clear the input field
      setMessageText("");
      
      // Scroll to bottom
      scrollToBottom();
      
      // Invalidate messages query to refresh the messages list but with debounce
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Track processed message IDs
  const [processedMessageIds, setProcessedMessageIds] = useState<number[]>([]);
  
  // Listen for incoming messages via WebSocket
  useEffect(() => {
    if (!lastMessage) return;
    
    // Handle new messages from other users
    if (lastMessage.type === "new_message") {
      const messageData = lastMessage.message;
      const messageId = messageData?.id;
      
      if (!messageId) {
        console.log('Received message without ID, ignoring');
        return;
      }
      
      // Check if we've already processed this message ID
      if (processedMessageIds.includes(messageId)) {
        console.log(`Already processed message ${messageId}, ignoring duplicate`);
        return;
      }
      
      // Add to processed IDs
      setProcessedMessageIds(prev => [...prev, messageId]);
      
      // Check for message compatibility (handling both content and text fields)
      const processedMessage = {
        ...messageData,
        // Ensure content field is populated either from content or text
        content: messageData.content || messageData.text || '',
      };
      
      // If this message belongs to our conversation AND was not sent by current user
      if (processedMessage.conversationId === conversationId && 
          processedMessage.senderId !== currentUser?.id) {
          
        // Check if we already have this message in our messages array
        const messageExists = messages.some(m => m.id === processedMessage.id);
        
        if (!messageExists) {
          console.log('Adding new message via WebSocket:', processedMessage);
          setMessages(prev => [...prev, processedMessage]);
          scrollToBottom();
          
          // Show toast notification for incoming messages
          toast({
            title: "New Message",
            description: `${recipientUser?.username || 'Someone'} sent you a message`,
            variant: "default",
          });
        } else {
          console.log('Message already exists in UI, not adding again');
        }
      }
    }
    
    // For message_sent confirmations, don't add message to UI since we already did that in the mutation
    if (lastMessage.type === "message_sent" && lastMessage.success) {
      const messageId = lastMessage.messageId || lastMessage.message?.id;
      
      if (messageId && !processedMessageIds.includes(messageId)) {
        // Add to processed IDs
        setProcessedMessageIds(prev => [...prev, messageId]);
        
        // Just refresh the messages list if needed
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      }
    }
  }, [lastMessage, conversationId, messages, currentUser?.id, recipientUser?.username, toast, queryClient, processedMessageIds]);
  
  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);
  
  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      await sendMessageMutation.mutateAsync(messageText);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
              <img 
                src={recipientUser?.profilePic || "/default-avatar.svg"} 
                alt={recipientUser?.username || "User"} 
                className="w-full h-full object-cover"
              />
            </div>
            <span>{recipientUser?.username || "User"}</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          {isConversationLoading || isMessagesLoading ? (
            <div className="flex justify-center items-center h-full">
              <FaSpinner className="animate-spin text-2xl text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter out duplicate messages by ID */}
              {messages.filter((message, index, self) => 
                index === self.findIndex((m) => m.id === message.id)
              ).map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`rounded-lg px-4 py-2 max-w-[70%] ${
                      message.senderId === currentUser?.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary'
                    }`}
                  >
                    <p>{message.content || message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        {/* Message input */}
        <form onSubmit={handleSendMessage} className="p-4 flex items-center space-x-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1"
            disabled={isSending || connectionStatus !== 'open' || !conversationId}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isSending || !messageText.trim() || connectionStatus !== 'open' || !conversationId}
          >
            {isSending ? (
              <FaSpinner className="animate-spin h-4 w-4" />
            ) : (
              <FaPaperPlane className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {connectionStatus !== 'open' && (
          <div className="bg-muted p-2 text-xs text-center text-muted-foreground">
            {connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
              ? 'Connecting to chat server...'
              : 'Not connected to chat server. Messages cannot be sent.'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}