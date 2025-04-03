import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Comment } from "../data/PostData";
import PostCard from "../components/PostCard";
import PostDetailModal from "../components/PostDetailModal";
import EditProfileModal from "../components/EditProfileModal";
import MessageModal from "../components/MessageModal";
import { FaCircleUser, FaChartLine, FaUserPlus, FaEllipsis } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { FiMessageCircle } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "../hooks/use-wallet";
import type { Post as DbPost } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

// Define Post type to match what PostCard component expects
interface User {
  id: number;
  username?: string;
  name?: string;
  profilePic?: string;
}

interface Post {
  id: number;
  userId: number;
  imageUrl: string;
  caption: string;
  feeling?: string;
  createdAt: string;
  user?: User;
  categories?: string[];
  likes?: number;
  comments?: any[];
}

export default function Profile() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const { user: currentUser } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get userId from URL query parameter
  const [userId, setUserId] = useState<number | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);
  
  // Parse userId from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('userId');
    
    if (userIdParam) {
      const parsedId = parseInt(userIdParam, 10);
      if (!isNaN(parsedId)) {
        setUserId(parsedId);
        setIsCurrentUserProfile(currentUser?.id === parsedId);
      }
    } else if (currentUser?.id) {
      // If no userId provided, show current user's profile
      setUserId(currentUser.id);
      setIsCurrentUserProfile(true);
    }
  }, [currentUser]);
  
  // Fetch user data for profile
  const { isLoading: isUserLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const userData = await response.json();
      setProfileUser(userData);
      return userData;
    },
    enabled: !!userId
  });
  
  // Fetch posts from API for the profile user
  const { data: dbPosts = [], isLoading } = useQuery({
    queryKey: ["posts", "user", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/posts?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      return response.json();
    },
    enabled: !!userId
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest({
        url: `/api/posts/${postId}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate query to refetch posts
      queryClient.invalidateQueries({ queryKey: ["posts", "user", userId] });
      toast({
        title: "Success",
        description: "Post has been deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Convert database posts to UI-compatible format
  const profilePosts: Post[] = dbPosts.map((dbPost: DbPost) => ({
    id: dbPost.id,
    user: {
      id: profileUser?.id || 0,
      username: profileUser?.username || "Loading...",
      name: profileUser?.username || "Loading...",
      profilePic: profileUser?.profilePic || "/default-avatar.svg"
    },
    imageUrl: dbPost.imageUrl,
    caption: dbPost.caption || "",
    likes: dbPost.likes || 0,
    feeling: dbPost.feeling || "normal",
    comments: [],
    categories: [],
    // Add these properties to match the PostCard component's expected Post type
    userId: dbPost.userId,
    createdAt: dbPost.createdAt
  }));

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };
  
  // Handler for deleting a post
  const handleDeletePost = async (postId: number) => {
    return deletePostMutation.mutateAsync(postId);
  };

  const stats = {
    posts: profilePosts.length,
    followers: 1248,
    following: 423
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow p-6">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 md:mb-0">
                <img 
                  src={profileUser?.profilePic || "/default-avatar.svg"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold mb-2 md:mb-0 text-foreground">
                    {profileUser?.username || "Loading..."}
                  </h1>
                  <div className="flex space-x-2">
                    {isCurrentUserProfile ? (
                      <button 
                        className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium flex items-center"
                        onClick={() => setIsEditProfileOpen(true)}
                      >
                        <FiEdit className="mr-1.5 h-3.5 w-3.5" />
                        Edit Profile
                      </button>
                    ) : (
                      <button 
                        className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium flex items-center"
                        onClick={() => {
                          if (!currentUser) {
                            toast({
                              title: "Please login",
                              description: "You need to connect your wallet to send messages",
                              variant: "destructive"
                            });
                            return;
                          }
                          setIsMessageModalOpen(true);
                        }}
                        disabled={!profileUser}
                      >
                        <FiMessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        Message
                      </button>
                    )}
                    <button className="p-2 border border-border rounded-full">
                      <FaEllipsis className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-6 mb-4">
                  <div className="text-center">
                    <span className="block font-bold text-foreground">{stats.posts}</span>
                    <span className="text-sm text-muted-foreground">Posts</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-foreground">{stats.followers}</span>
                    <span className="text-sm text-muted-foreground">Followers</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-foreground">{stats.following}</span>
                    <span className="text-sm text-muted-foreground">Following</span>
                  </div>
                </div>
                
                <div>
                  <h2 className="font-medium text-foreground">
                    {profileUser?.walletAddress ? 
                      `${profileUser.walletAddress.substring(0, 6)}...${profileUser.walletAddress.substring(profileUser.walletAddress.length - 4)}` 
                      : "Loading..."}
                  </h2>
                  <p className="text-sm text-foreground mt-1">
                    {profileUser?.bio || "PICTagram user"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Profile Tabs */}
            <div className="border-t border-border mt-8 pt-4">
              <div className="flex justify-center space-x-8">
                <button
                  className={`flex items-center px-4 py-2 ${
                    activeTab === "posts" 
                      ? "border-b-2 border-primary text-foreground" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab("posts")}
                >
                  <div className="flex items-center">
                    <FaCircleUser className="mr-2 h-4 w-4" />
                    <span>Posts</span>
                  </div>
                </button>
                <button
                  className={`flex items-center px-4 py-2 ${
                    activeTab === "saved" 
                      ? "border-b-2 border-primary text-foreground" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab("saved")}
                >
                  <div className="flex items-center">
                    <FaChartLine className="mr-2 h-4 w-4" />
                    <span>Saved</span>
                  </div>
                </button>
                <button
                  className={`flex items-center px-4 py-2 ${
                    activeTab === "tagged" 
                      ? "border-b-2 border-primary text-foreground" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab("tagged")}
                >
                  <div className="flex items-center">
                    <FaUserPlus className="mr-2 h-4 w-4" />
                    <span>Tagged</span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Content based on tab */}
            <div className="mt-6">
              {activeTab === "posts" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profilePosts.map((post: Post) => (
                    <PostCard key={post.id} post={post} onClick={() => handlePostClick(post)} />
                  ))}
                  
                  {profilePosts.length === 0 && (
                    <div className="col-span-3 text-center py-10">
                      <p className="text-muted-foreground">No posts yet</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "saved" && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No saved posts</p>
                </div>
              )}
              
              {activeTab === "tagged" && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No tagged posts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {selectedPost && (
        <PostDetailModal
          post={{
            ...selectedPost,
            // Ensure required properties for PostDetailModal
            likes: selectedPost.likes || 0, 
            comments: selectedPost.comments || [],
            user: {
              ...selectedPost.user,
              id: selectedPost.user?.id || 0,
              name: selectedPost.user?.name || selectedPost.user?.username || "User",
              username: selectedPost.user?.username || selectedPost.user?.name || "User",
              profilePic: selectedPost.user?.profilePic || "/default-avatar.svg"
            }
          } as any} // Use type assertion for compatibility
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={handleDeletePost}
        />
      )}
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        user={currentUser}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={() => {
          // Refresh user data
          queryClient.invalidateQueries({ queryKey: ["user", userId] });
          queryClient.invalidateQueries({ queryKey: ["user", currentUser?.id] });
        }}
      />
      
      {/* Message Modal */}
      {profileUser && (
        <MessageModal
          recipientUser={profileUser}
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
        />
      )}
    </div>
  );
}