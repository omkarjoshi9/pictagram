import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineHeart, HiOutlineShare } from "react-icons/hi";
import { HiOutlineBookmark, HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { Post } from "@/data/PostData";
import { FaEllipsisH } from "react-icons/fa";

interface PostDetailModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, isOpen, onClose }) => {
  return (
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
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
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
                    <p className="text-sm font-medium">{post.user.name}</p>
                    <p className="text-xs text-muted">{post.feeling}</p>
                  </div>
                  <button className="ml-auto text-muted">
                    <FaEllipsisH />
                  </button>
                </div>
                
                <div className="py-4 flex-grow overflow-y-auto">
                  <p className="text-sm">{post.caption}</p>
                  
                  <div className="mt-6 space-y-4 max-h-64 overflow-y-auto">
                    {post.comments.map((comment, index) => (
                      <div className="flex" key={index}>
                        <img 
                          src={comment.user.profilePic}
                          alt={comment.user.name} 
                          className="h-8 w-8 rounded-full object-cover mr-2"
                        />
                        <div>
                          <p className="text-xs font-medium">{comment.user.name}</p>
                          <p className="text-xs">{comment.text}</p>
                          <div className="flex items-center mt-1 text-xs text-muted">
                            <span>{comment.timeAgo}</span>
                            <span className="mx-1">·</span>
                            <button className="font-medium">Like</button>
                            <span className="mx-1">·</span>
                            <button className="font-medium">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between mb-3">
                    <div className="flex space-x-4">
                      <button className="flex items-center text-muted hover:text-primary">
                        <HiOutlineHeart className="h-6 w-6" />
                      </button>
                      <button className="flex items-center text-muted hover:text-primary">
                        <HiOutlineChatBubbleOvalLeft className="h-6 w-6" />
                      </button>
                      <button className="flex items-center text-muted hover:text-primary">
                        <HiOutlineShare className="h-6 w-6" />
                      </button>
                    </div>
                    <button className="flex items-center text-muted hover:text-primary">
                      <HiOutlineBookmark className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mt-2 flex items-center">
                    <img 
                      src="/assets/image/avatar_default.jpg"
                      alt="Your profile" 
                      className="h-8 w-8 rounded-full object-cover mr-2"
                    />
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      className="w-full text-sm border-none focus:ring-0 focus:outline-none"
                    />
                    <button className="ml-2 text-primary font-medium text-sm">Post</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostDetailModal;
