import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Post } from "../data/PostData";
import PostCard from "../components/PostCard";
import PostDetailModal from "../components/PostDetailModal";
import { apiRequest } from "../lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "../hooks/use-wallet";
import { Skeleton } from "../components/ui/skeleton";

export default function Bookmarks() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useWallet();
  
  // Query saved posts from API
  const { data: bookmarkedPosts, isLoading, error } = useQuery({
    queryKey: ["bookmarks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const posts = await apiRequest({
        url: `/api/users/${user.id}/bookmarks`,
        method: "GET"
      }) as Post[];
      
      return posts;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false
  });

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="bg-card rounded-lg overflow-hidden shadow">
          <Skeleton className="w-full h-48" />
          <div className="p-4">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mt-3" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="bookmarks" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Bookmarks</h1>
            
            {isLoading ? (
              renderLoadingSkeletons()
            ) : error ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-destructive mb-1">Failed to load bookmarks</h3>
                <p className="text-sm text-muted-foreground">Please try again later</p>
              </div>
            ) : !user ? (
              <div className="text-center py-10">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">Sign in to view bookmarks</h3>
                <p className="text-sm text-muted-foreground">Connect your wallet to see your saved posts</p>
              </div>
            ) : bookmarkedPosts && bookmarkedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedPosts.map((post: Post) => (
                  <PostCard key={post.id} post={post} onClick={() => handlePostClick(post)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">No Saved Posts Yet</h3>
                <p className="text-sm text-muted-foreground">When you bookmark posts, they'll appear here</p>
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