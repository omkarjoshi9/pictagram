import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Post as PostType, Comment } from "../data/PostData";
import PostCard from "../components/PostCard";
import PostDetailModal from "../components/PostDetailModal";
import { FaCircleUser, FaChartLine, FaUserPlus, FaEllipsis } from "react-icons/fa6";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "../hooks/use-wallet";
import type { Post as DbPost } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

export default function Profile() {
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch posts from API for the current user
  const { data: dbPosts = [], isLoading } = useQuery({
    queryKey: ["posts", "user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/posts?userId=${user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      return response.json();
    },
    enabled: !!user?.id
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
      queryClient.invalidateQueries({ queryKey: ["posts", "user", user?.id] });
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
  const profilePosts: PostType[] = dbPosts.map((dbPost: DbPost) => ({
    id: dbPost.id,
    user: {
      id: user?.id || 0,
      name: user?.username || "Loading...",
      profilePic: user?.profilePic || "/default-avatar.svg"
    },
    imageUrl: dbPost.imageUrl,
    caption: dbPost.caption || "",
    likes: dbPost.likes || 0,
    feeling: dbPost.feeling || "normal",
    comments: [],
    categories: []
  }));

  const handlePostClick = (post: PostType) => {
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
                  src={user?.profilePic || "/default-avatar.svg"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold mb-2 md:mb-0 text-foreground">
                    {user?.username || "Loading..."}
                  </h1>
                  <div className="flex space-x-2">
                    <button className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium">
                      Edit Profile
                    </button>
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
                    {user?.walletAddress ? 
                      `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}` 
                      : "Loading..."}
                  </h2>
                  <p className="text-sm text-foreground mt-1">
                    {user?.bio || "PICTagram user"}
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
                  {profilePosts.map((post: PostType) => (
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
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={handleDeletePost}
        />
      )}
    </div>
  );
}