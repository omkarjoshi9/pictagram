import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { posts } from "../data/PostData";
import PostCard from "../components/PostCard";
import PostDetailModal from "../components/PostDetailModal";

export default function Bookmarks() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // For demo purposes, let's use some of the posts as bookmarked posts
  const bookmarkedPosts = posts.slice(0, 3);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="bookmarks" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Bookmarks</h1>
            
            {bookmarkedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedPosts.map((post) => (
                  <PostCard key={post.id} post={post} onClick={() => handlePostClick(post)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">No Saved Posts Yet</h3>
                <p className="text-sm text-muted">When you bookmark posts, they'll appear here</p>
              </div>
            )}
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