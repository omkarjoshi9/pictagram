import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineHeart, HiOutlineShare, HiOutlineTrash } from "react-icons/hi";
import { HiOutlineBookmark, HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { Post } from "../data/PostData";
import { FaEllipsisH } from "react-icons/fa";
import { useWallet } from "../hooks/use-wallet";
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

interface PostDetailModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (postId: number) => Promise<void>;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, isOpen, onClose, onDelete }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useWallet();

  // Check if current user is the post owner
  const isOwner = user?.id === post.user.id;

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
                      {post.comments.map((comment, index) => (
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
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between mb-3">
                      <div className="flex space-x-4">
                        <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                          <HiOutlineHeart className="h-6 w-6" />
                        </button>
                        <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                          <HiOutlineChatBubbleOvalLeft className="h-6 w-6" />
                        </button>
                        <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                          <HiOutlineShare className="h-6 w-6" />
                        </button>
                      </div>
                      <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                        <HiOutlineBookmark className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <img 
                        src="/assets/image/avatar_default.jpg"
                        alt="Your profile" 
                        className="h-8 w-8 rounded-full object-cover mr-2"
                      />
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder="Add a comment..." 
                          className="w-full text-sm py-2 px-3 border border-border rounded-full focus:ring-1 focus:ring-primary focus:outline-none bg-secondary text-foreground"
                        />
                      </div>
                      <button className="ml-2 text-primary font-medium text-sm hover:text-primary/80 transition-colors">Post</button>
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
