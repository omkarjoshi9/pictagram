import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useWallet } from "../hooks/use-wallet";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

// Change password modal component
function ChangePasswordModal({ isOpen, onClose, userId }: { isOpen: boolean; onClose: () => void; userId: number }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest({
        url: `/api/users/${userId}/change-password`,
        method: "POST",
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
        variant: "success",
      });
      onClose();
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to change password");
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to change password",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Change Password</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white rounded-md"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, account } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user details
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users', user?.id],
    queryFn: () => apiRequest({ url: `/api/users/${user?.id}` }),
    enabled: !!user?.id
  });
  
  // Update user settings
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest({
        url: `/api/users/${user?.id}`,
        method: "PUT",
        data: userData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to update settings",
        variant: "destructive",
      });
    }
  });
  
  // Update form values when user data is loaded
  useEffect(() => {
    if (userData) {
      setUsername(userData.username || "");
      setEmail(userData.email || "");
      setBio(userData.bio || "");
      setIsPrivate(userData.isPrivate || false);
      setShowActivityStatus(userData.showActivityStatus !== false); // Default to true if undefined
      setPushNotifications(userData.pushNotifications !== false); // Default to true if undefined
      setEmailNotifications(userData.emailNotifications !== false); // Default to true if undefined
    }
  }, [userData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateUserMutation.mutate({
      username,
      email,
      bio,
      isPrivate,
      showActivityStatus,
      pushNotifications,
      emailNotifications
    });
  };
  
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 flex">
          <Sidebar activePage="settings" />
          <div className="w-full md:w-4/5 py-6 flex justify-center items-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="settings" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-border pb-6">
                <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input 
                      type="text" 
                      className="w-full md:w-1/2 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full md:w-1/2 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea 
                      className="w-full md:w-1/2 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Wallet Address</label>
                    <input 
                      type="text" 
                      className="w-full md:w-1/2 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={account || "Not connected"}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">Your blockchain wallet address (cannot be changed)</p>
                  </div>
                </div>
              </div>
              
              <div className="border-b border-border pb-6">
                <h2 className="text-lg font-semibold mb-4">Privacy & Security</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Private Account</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Show Activity Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={showActivityStatus}
                        onChange={(e) => setShowActivityStatus(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="text-sm text-primary font-medium"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Push Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Email Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Change Password Modal */}
      {user && (
        <ChangePasswordModal 
          isOpen={isChangePasswordModalOpen} 
          onClose={() => setIsChangePasswordModalOpen(false)}
          userId={user.id}
        />
      )}
    </div>
  );
}