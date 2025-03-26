import React from "react";
import { HiOutlineHeart, HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { motion } from "framer-motion";
import { Post } from "@/data/PostData";

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  return (
    <div 
      className="post-card relative overflow-hidden rounded-lg group cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-w-1 aspect-h-1">
        <img 
          src={post.imageUrl} 
          alt={post.caption} 
          className="object-cover w-full h-full"
        />
        <motion.div 
          className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center space-x-4 text-white"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center">
            <HiOutlineHeart className="h-5 w-5 mr-1" />
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center">
            <HiOutlineChatBubbleOvalLeft className="h-5 w-5 mr-1" />
            <span>{post.comments.length}</span>
          </div>
        </motion.div>
      </div>
      <div className="p-2">
        <div className="flex items-center">
          <img 
            src={post.user.profilePic}
            alt={post.user.name} 
            className="h-5 w-5 rounded-full object-cover mr-1"
          />
          <span className="text-xs font-medium truncate">{post.user.name}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
