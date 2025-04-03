import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useWallet } from "../hooks/use-wallet";
import { useToast } from "../hooks/use-toast";
import { useWebSocketContext } from "../components/WebSocketProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";

interface User {
  id: number;
  username: string;
  profilePic?: string;
}

interface Notification {
  id: number;
  userId: number;
  actorId: number | null;
  type: string;
  entityId: number | null;
  entityType: string | null;
  read: boolean;
  data: any;
  createdAt: string;
  actor?: User;
}

export default function Notifications() {
  const { user } = useWallet();
  const { toast } = useToast();
  const { sendMessage, connectionStatus } = useWebSocketContext();
  const queryClient = useQueryClient();
  
  // Get user's notifications from the API
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['/api/users', user?.id, 'notifications'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch(`/api/users/${user.id}/notifications`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const notificationsData: Notification[] = await response.json();
      
      // Fetch actor details for each notification
      const notificationsWithActors = await Promise.all(
        notificationsData.map(async (notification) => {
          if (notification.actorId) {
            try {
              const actorResponse = await fetch(`/api/users/${notification.actorId}`);
              if (actorResponse.ok) {
                const actor = await actorResponse.json();
                return { ...notification, actor };
              }
            } catch (e) {
              console.error('Error fetching actor:', e);
            }
          }
          return notification;
        })
      );
      
      return notificationsWithActors;
    },
    enabled: !!user?.id,
  });
  
  // Mark a single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const response = await fetch(`/api/users/${user.id}/notifications/read-all`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'notifications'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
      
      // Also notify via WebSocket for real-time updates
      if (connectionStatus === 'open' && user?.id) {
        sendMessage({
          type: 'notifications_read_all',
          userId: user.id.toString(),
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });
  
  // Handle marking a notification as read
  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
      
      // Also notify via WebSocket for real-time updates
      if (connectionStatus === 'open') {
        sendMessage({
          type: 'notification_read',
          notificationId: notification.id,
        });
      }
    }
  };
  
  // Format the notification content based on type
  const getNotificationContent = (notification: Notification) => {
    switch(notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'mention':
        return 'mentioned you in a comment';
      case 'message':
        return 'sent you a message';
      default:
        return notification.data?.content || 'interacted with your content';
    }
  };
  
  // Format the time to display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="notifications" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h1 className="text-xl font-bold">Notifications</h1>
              {notifications.filter(n => !n.read).length > 0 && (
                <button 
                  className="text-sm text-primary font-medium hover:underline"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">Loading Notifications...</h3>
              </div>
            ) : (
              <>
                {notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 flex items-center hover:bg-secondary ${!notification.read ? 'bg-primary-light/10' : ''}`}
                        onClick={() => handleMarkAsRead(notification)}
                      >
                        <div className="relative">
                          <img 
                            src={notification.actor?.profilePic || "/default-avatar.svg"}
                            alt={notification.actor?.username || "User"} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          {!notification.read && (
                            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-primary rounded-full"></span>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{notification.actor?.username || "A user"}</span> {getNotificationContent(notification)}
                          </p>
                          <span className="text-xs text-muted">
                            {notification.createdAt ? formatTime(notification.createdAt) : "Recently"}
                          </span>
                        </div>
                        
                        {notification.type === "follow" && (
                          <button 
                            className="px-3 py-1 bg-primary text-white rounded-full text-xs font-medium hover:bg-primary/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Follow back functionality would go here
                              toast({
                                title: "Coming Soon",
                                description: "Follow functionality will be available soon!",
                              });
                            }}
                          >
                            Follow Back
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Notifications</h3>
                    <p className="text-sm text-muted">We'll notify you when something arrives</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}