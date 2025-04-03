import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CategoryTabs from "@/components/CategoryTabs";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define the Post interface based on our database schema
interface User {
  id: number;
  username: string;
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
}

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("ForYou");
  const [selectedPost, setSelectedPost] = useState<null | number>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all posts from the API
  const { data: posts = [], isLoading, error } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      // Fetch posts with their categories
      const postsResponse = await fetch('/api/posts');
      if (!postsResponse.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const postsData = await postsResponse.json();
      
      // For each post, fetch the user and categories
      const postsWithDetails = await Promise.all(postsData.map(async (post: Post) => {
        // Fetch user details
        const userResponse = await fetch(`/api/users/${post.userId}`);
        const userData = userResponse.ok ? await userResponse.json() : null;
        
        // Fetch post categories
        const categoriesResponse = await fetch(`/api/posts/${post.id}/categories`);
        const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : [];
        
        // Extract category names
        const categoryNames = categoriesData.map((cat: any) => cat.name);
        
        // Return post with user and categories
        return {
          ...post,
          user: userData,
          categories: categoryNames
        };
      }));
      
      return postsWithDetails;
    }
  });

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

  // Filter posts based on active category
  const filteredPosts = posts.filter(post => {
    if (activeCategory === "ForYou" || activeCategory === "Trending") {
      return true;
    }
    // Check if post has categories and if any match the active category
    return post.categories && post.categories.some(cat => 
      cat.toLowerCase() === activeCategory.toLowerCase()
    );
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
            
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading posts...</span>
              </div>
            )}
            
            {error && (
              <div className="mt-8 text-center py-10">
                <p className="text-destructive">Error loading posts. Please try again.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            )}
            
            {!isLoading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              </>
            )}
          </div>
        </div>
      </div>
      
      {isModalOpen && selectedPost !== null && !isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Post Details</h2>
            {posts.find(p => p.id === selectedPost) && (
              <div>
                <img 
                  src={posts.find(p => p.id === selectedPost)?.imageUrl} 
                  alt="Post" 
                  className="w-full h-auto mb-4 rounded-md"
                />
                <p className="text-sm mb-3">{posts.find(p => p.id === selectedPost)?.caption}</p>
                
                {posts.find(p => p.id === selectedPost)?.categories && (
                  <div className="flex flex-wrap gap-1 mt-2 mb-4">
                    {posts.find(p => p.id === selectedPost)?.categories?.map((category, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        #{category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={handleModalClose}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
