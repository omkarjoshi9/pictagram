import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineHeart, HiOutlineShare, HiOutlineTrash, HiHeart } from "react-icons/hi";
import { HiOutlineBookmark, HiOutlineChatBubbleOvalLeft, HiBookmark } from "react-icons/hi2";
// Import Post type and define compatible interface for component
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
  user: User;
  categories?: string[];
  likes: number;
  comments: Array<{
    user: User;
    text: string;
    timeAgo: string;
  }>;
}
import { FaEllipsisH } from "react-icons/fa";
import { useWallet } from "../hooks/use-wallet";
import { useToast } from "../hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useWebSocketContext } from "./WebSocketProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

interface PostDetailModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (postId: number) => Promise<void>;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, isOpen, onClose, onDelete }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [postComments, setPostComments] = useState(post.comments);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { user } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is the post owner
  const isOwner = user?.id === post.user.id;
  
  // Focus on comment input when comment button is clicked
  const focusCommentInput = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };
  
  // WebSocket connection
  const { sendMessage } = useWebSocketContext();

  // Get like status
  const likeStatusQuery = useQuery({
    queryKey: ["postLike", post.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return { liked: false };
      
      const response = await apiRequest({
        url: `/api/posts/${post.id}/like?userId=${user.id}`,
        method: "GET"
      });
      
      return response;
    },
    enabled: !!user?.id && isOpen,
    refetchOnWindowFocus: false
  });

  // Get bookmark status
  const bookmarkStatusQuery = useQuery({
    queryKey: ["postBookmark", post.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return { bookmarked: false };
      
      const response = await apiRequest({
        url: `/api/posts/${post.id}/bookmark?userId=${user.id}`,
        method: "GET"
      });
      
      return response;
    },
    enabled: !!user?.id && isOpen,
    refetchOnWindowFocus: false
  });
  
  // Update liked and saved state when the queries load
  useEffect(() => {
    if (likeStatusQuery.data) {
      setLiked(likeStatusQuery.data.liked);
    }
    
    if (bookmarkStatusQuery.data) {
      setSaved(bookmarkStatusQuery.data.bookmarked);
    }
  }, [likeStatusQuery.data, bookmarkStatusQuery.data]);
  
  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to like a post");
      
      const response = await apiRequest({
        url: `/api/posts/${post.id}/like`,
        method: "POST",
        data: { userId: user.id }
      });
      
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["postLike", post.id, user?.id] });
      
      // Update local state with the response
      setLiked(data.liked);
      if (data.post) {
        setLikesCount(data.post.likes);
      }
      
      // Notify other clients via WebSocket
      sendMessage({
        type: "like",
        postId: post.id,
        userId: user?.id,
        likes: likesCount + (data.liked ? 1 : -1)
      });
    },
    onError: (error: any) => {
      // Revert UI if failed
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive"
      });
    }
  });
  
  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user?.id) throw new Error("You must be logged in to comment");
      if (!text.trim()) throw new Error("Comment cannot be empty");
      
      const response = await apiRequest({
        url: `/api/comments`,
        method: "POST",
        data: { text, userId: user.id, postId: post.id }
      });
      
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      
      // Add new comment to the list
      const newComment = {
        user: {
          id: user?.id || 0,
          name: user?.username || "",
          profilePic: user?.profilePic || "/default-avatar.svg"
        },
        text: comment,
        timeAgo: "Just now"
      };
      
      setPostComments([...postComments, newComment]);
      setComment("");
      
      // Notify other clients via WebSocket
      sendMessage({
        type: "new_comment",
        postId: post.id,
        comment: newComment
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive"
      });
    }
  });
  
  // Save/bookmark mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to save a post");
      
      const response = await apiRequest({
        url: `/api/posts/${post.id}/bookmark`,
        method: "POST",
        data: { userId: user.id }
      });
      
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["postBookmark", post.id, user?.id] });
      
      // Update local state with the response
      setSaved(data.bookmarked);
      
      // Notify other clients via WebSocket
      sendMessage({
        type: "bookmark",
        postId: post.id,
        userId: user?.id,
        bookmarked: data.bookmarked
      });
    },
    onError: (error: any) => {
      // Revert UI if failed
      setSaved(!saved);
      
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive"
      });
    }
  });
  
  // Share functionality
  const handleShare = () => {
    // For now, just copy the URL to clipboard
    // In a real app, this would open a share modal with more options
    try {
      const shareText = `Check out this post by ${post.user.name}: ${window.location.origin}/posts/${post.id}`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Toggle like
  const handleLike = () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to like posts",
        variant: "destructive"
      });
      return;
    }
    
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    likeMutation.mutate();
  };
  
  // Toggle save
  const handleSave = () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to save posts",
        variant: "destructive"
      });
      return;
    }
    
    setSaved(!saved);
    saveMutation.mutate();
  };
  
  // Post comment
  const handlePostComment = () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to comment",
        variant: "destructive"
      });
      return;
    }
    
    if (!comment.trim()) {
      toast({
        title: "Empty comment",
        description: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    commentMutation.mutate(comment);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(post.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex md:flex-row flex-col">
                <div className="md:w-3/5 relative">
                  <img 
                    src={post.imageUrl}
                    alt={post.caption} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:w-2/5 p-4 flex flex-col">
                  <div className="flex items-center pb-3 border-b border-border">
                    <img 
                      src={post.user.profilePic}
                      alt={post.user.name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-foreground">{post.user.name}</p>
                      <p className="text-xs text-muted-foreground">{post.feeling}</p>
                    </div>
                    
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                            <FaEllipsisH />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => setIsDeleteDialogOpen(true)}
                          >
                            <HiOutlineTrash className="mr-2 h-4 w-4" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <div className="py-4 flex-grow overflow-y-auto">
                    <p className="text-sm text-foreground">{post.caption}</p>
                    
                    <div className="mt-6 space-y-4 max-h-64 overflow-y-auto">
                      {postComments.map((comment, index) => (
                        <div className="flex" key={index}>
                          <img 
                            src={comment.user.profilePic}
                            alt={comment.user.name} 
                            className="h-8 w-8 rounded-full object-cover mr-2"
                          />
                          <div>
                            <p className="text-xs font-medium text-foreground">{comment.user.name}</p>
                            <p className="text-xs text-foreground">{comment.text}</p>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <span>{comment.timeAgo}</span>
                              <span className="mx-1">·</span>
                              <button className="font-medium hover:text-primary">Like</button>
                              <span className="mx-1">·</span>
                              <button className="font-medium hover:text-primary">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {postComments.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No comments yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between mb-3">
                      <div className="flex space-x-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={handleLike}
                                className={`flex items-center ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-primary'} transition-colors`}
                                disabled={likeMutation.isPending}
                              >
                                {liked ? 
                                  <HiHeart className="h-6 w-6" /> : 
                                  <HiOutlineHeart className="h-6 w-6" />
                                }
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{liked ? 'Unlike' : 'Like'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={focusCommentInput}
                                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                              >
                                <HiOutlineChatBubbleOvalLeft className="h-6 w-6" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Comment</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={handleShare}
                                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                              >
                                <HiOutlineShare className="h-6 w-6" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={handleSave}
                              className={`flex items-center ${saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'} transition-colors`}
                              disabled={saveMutation.isPending}
                            >
                              {saved ? 
                                <HiBookmark className="h-6 w-6" /> : 
                                <HiOutlineBookmark className="h-6 w-6" />
                              }
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{saved ? 'Unsave' : 'Save'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="text-sm font-medium mb-2">
                      {likesCount > 0 && (
                        <p>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</p>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <img 
                        src={user?.profilePic || "/default-avatar.svg"} 
                        alt={user?.username || "Your profile"} 
                        className="h-8 w-8 rounded-full object-cover mr-2"
                      />
                      <div className="flex-1 relative">
                        <input 
                          ref={commentInputRef}
                          type="text" 
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment..." 
                          className="w-full text-sm py-2 px-3 border border-border rounded-full focus:ring-1 focus:ring-primary focus:outline-none bg-secondary text-foreground"
                          onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                      </div>
                      <button 
                        onClick={handlePostComment}
                        disabled={commentMutation.isPending || !comment.trim()}
                        className="ml-2 text-primary font-medium text-sm hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commentMutation.isPending ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostDetailModal;
