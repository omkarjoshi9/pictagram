import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Post, posts } from "../data/PostData";
import PostCard from "../components/PostCard";
import PostDetailModal from "../components/PostDetailModal";
import { FaCircleUser, FaChartLine, FaUserPlus, FaEllipsis } from "react-icons/fa6";

export default function Profile() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
  // Filtered posts for the profile
  const profilePosts = posts.filter(post => post.user.name === "Omkar Joshi");

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
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
                  src="/assets/image/avatar_default.jpg" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold mb-2 md:mb-0 text-foreground">Omkar Joshi</h1>
                  <div className="flex space-x-2">
                    <button className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium">
                      Follow
                    </button>
                    <button className="px-4 py-1.5 border border-border rounded-full text-sm font-medium text-foreground">
                      Message
                    </button>
                    <button className="p-2 border border-border rounded-full">
                      <FaEllipsis className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-6 mb-4">
                  <div className="text-center">
                    <span className="block font-bold text-foreground">{stats.posts}</span>
                    <span className="text-sm text-muted">Posts</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-foreground">{stats.followers}</span>
                    <span className="text-sm text-muted">Followers</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-foreground">{stats.following}</span>
                    <span className="text-sm text-muted">Following</span>
                  </div>
                </div>
                
                <div>
                  <h2 className="font-medium text-foreground">@omkarjoshi</h2>
                  <p className="text-sm text-foreground mt-1">Software developer and photography enthusiast. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet.</p>
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
                      : "text-muted"
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
                      : "text-muted"
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
                      : "text-muted"
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
                  {profilePosts.map((post) => (
                    <PostCard key={post.id} post={post} onClick={() => handlePostClick(post)} />
                  ))}
                  
                  {profilePosts.length === 0 && (
                    <div className="col-span-3 text-center py-10">
                      <p className="text-muted">No posts yet</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "saved" && (
                <div className="text-center py-10">
                  <p className="text-muted">No saved posts</p>
                </div>
              )}
              
              {activeTab === "tagged" && (
                <div className="text-center py-10">
                  <p className="text-muted">No tagged posts</p>
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
        />
      )}
    </div>
  );
}