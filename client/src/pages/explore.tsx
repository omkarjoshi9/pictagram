import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CategoryTabs from "@/components/CategoryTabs";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { Post, posts } from "@/data/PostData";

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("ForYou");
  const [selectedPost, setSelectedPost] = useState<null | number>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostClick = (postId: number) => {
    setSelectedPost(postId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const categories = [
    "ForYou",
    "Trending",
    "Photography",
    "Art",
    "Music",
    "Sports",
    "Food",
    "Travel"
  ];

  // Filter posts based on active category (for demonstration purposes)
  const filteredPosts = posts.filter(post => {
    if (activeCategory === "ForYou" || activeCategory === "Trending") {
      return true;
    }
    return post.categories.includes(activeCategory.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row">
          <Sidebar activePage="explore" />
          
          <div className="w-full md:w-4/5 py-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Explore</h1>
            
            <CategoryTabs 
              categories={categories} 
              activeCategory={activeCategory} 
              setActiveCategory={setActiveCategory} 
            />
            
            <div className="explore-grid">
              {filteredPosts.map((post) => (
                <PostCard 
                  key={post.id}
                  post={post}
                  onClick={() => handlePostClick(post.id)}
                />
              ))}
            </div>
            
            {filteredPosts.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button className="px-6 py-2 bg-secondary border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                  Load More
                </button>
              </div>
            )}
            
            {filteredPosts.length === 0 && (
              <div className="mt-8 text-center py-10">
                <p className="text-muted-foreground">No posts found in this category</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isModalOpen && selectedPost !== null && (
        <PostDetailModal 
          post={posts.find(p => p.id === selectedPost)!}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
