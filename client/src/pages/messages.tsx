import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { userData, User } from "../data/UserData";

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  
  // Sample messages data
  const conversations = [
    {
      user: userData[0],
      lastMessage: "Hey, how's it going?",
      time: "2h ago",
      unread: true
    },
    {
      user: userData[1],
      lastMessage: "Let's catch up soon!",
      time: "1d ago",
      unread: false
    },
    {
      user: userData[2],
      lastMessage: "Did you see that new post?",
      time: "2d ago",
      unread: false
    }
  ];

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
              </div>
              
              <div className="overflow-y-auto h-[calc(70vh-60px)]">
                {conversations.map((conversation, index) => (
                  <div 
                    key={index}
                    className={`p-4 flex items-center border-b border-border hover:bg-secondary cursor-pointer ${
                      selectedUser?.id === conversation.user.id ? 'bg-secondary' : ''
                    }`}
                    onClick={() => setSelectedUser(conversation.user)}
                  >
                    <div className="relative">
                      <img 
                        src={conversation.user.profilePic} 
                        alt={conversation.user.name} 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      {conversation.unread && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-primary rounded-full"></span>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium truncate">{conversation.user.name}</p>
                        <span className="text-xs text-muted">{conversation.time}</span>
                      </div>
                      <p className="text-xs text-muted truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                ))}
                
                {conversations.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted">No conversations yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message area */}
            <div className="w-2/3 flex flex-col">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-border flex items-center">
                    <img 
                      src={selectedUser.profilePic} 
                      alt={selectedUser.name} 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <p className="ml-3 text-sm font-medium">{selectedUser.name}</p>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex flex-col space-y-3">
                      <div className="flex">
                        <div className="bg-secondary rounded-xl rounded-tl-none p-3 max-w-[70%]">
                          <p className="text-sm">Hey there! How are you doing?</p>
                          <span className="text-xs text-muted mt-1 block">10:30 AM</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <div className="bg-primary text-white rounded-xl rounded-tr-none p-3 max-w-[70%]">
                          <p className="text-sm">I'm good! Just working on some new designs.</p>
                          <span className="text-xs text-primary-foreground mt-1 block">10:35 AM</span>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="bg-secondary rounded-xl rounded-tl-none p-3 max-w-[70%]">
                          <p className="text-sm">That sounds exciting! Can't wait to see them.</p>
                          <span className="text-xs text-muted mt-1 block">10:40 AM</span>
                        </div>
                      </div>
                    </div>
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
                            // Handle send message
                            if (messageText.trim()) {
                              setMessageText('');
                            }
                          }
                        }}
                      />
                      <button 
                        className="ml-3 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center"
                        onClick={() => {
                          if (messageText.trim()) {
                            setMessageText('');
                          }
                        }}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
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
                    <p className="text-sm text-muted">Select a conversation to start chatting</p>
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