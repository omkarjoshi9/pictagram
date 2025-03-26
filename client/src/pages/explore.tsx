import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CategoryTabs from "@/components/CategoryTabs";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { posts } from "@/data/PostData";

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
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row">
          <Sidebar activePage="explore" />
          
          <div className="md:w-4/5 py-6">
            <h1 className="text-2xl font-bold mb-6">Explore</h1>
            
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
            
            <div className="mt-8 flex justify-center">
              <button className="px-6 py-2 bg-white border border-border rounded-full text-sm font-medium text-dark hover:bg-secondary transition-colors">
                Load More
              </button>
            </div>
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
