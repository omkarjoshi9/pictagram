import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { userData } from "../data/UserData";

export default function Notifications() {
  // Sample notification data
  const notifications = [
    {
      id: 1,
      user: userData[0],
      type: "like",
      content: "liked your post",
      time: "2h ago",
      read: false
    },
    {
      id: 2,
      user: userData[1],
      type: "comment",
      content: "commented on your post",
      time: "4h ago",
      read: false
    },
    {
      id: 3,
      user: userData[2],
      type: "follow",
      content: "started following you",
      time: "6h ago",
      read: true
    },
    {
      id: 4,
      user: userData[3],
      type: "mention",
      content: "mentioned you in a comment",
      time: "1d ago",
      read: true
    },
    {
      id: 5,
      user: userData[0],
      type: "follow",
      content: "started following you",
      time: "2d ago",
      read: true
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="notifications" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h1 className="text-xl font-bold">Notifications</h1>
              <button className="text-sm text-primary font-medium">Mark all as read</button>
            </div>
            
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 flex items-center hover:bg-secondary ${!notification.read ? 'bg-primary-light/10' : ''}`}
                >
                  <div className="relative">
                    <img 
                      src={notification.user.profilePic} 
                      alt={notification.user.name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {!notification.read && (
                      <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-primary rounded-full"></span>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{notification.user.name}</span> {notification.content}
                    </p>
                    <span className="text-xs text-muted">{notification.time}</span>
                  </div>
                  
                  {notification.type === "follow" && (
                    <button className="px-3 py-1 bg-primary text-white rounded-full text-xs font-medium">
                      Follow Back
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {notifications.length === 0 && (
              <div className="p-8 text-center">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">No New Notifications</h3>
                <p className="text-sm text-muted">We'll notify you when something arrives</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}