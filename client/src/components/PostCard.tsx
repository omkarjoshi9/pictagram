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
      className="post-card relative overflow-hidden rounded-lg shadow-sm border border-border group cursor-pointer bg-card"
      onClick={onClick}
    >
      <div className="aspect-square">
        <img 
          src={post.imageUrl} 
          alt={post.caption} 
          className="object-cover w-full h-full"
        />
        <motion.div 
          className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center space-x-4 text-white"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center bg-black/30 px-2 py-1 rounded">
            <HiOutlineHeart className="h-5 w-5 mr-1" />
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center bg-black/30 px-2 py-1 rounded">
            <HiOutlineChatBubbleOvalLeft className="h-5 w-5 mr-1" />
            <span>{post.comments.length}</span>
          </div>
        </motion.div>
      </div>
      <div className="p-3">
        <div className="flex items-center mb-1">
          <img 
            src={post.user.profilePic}
            alt={post.user.name} 
            className="h-6 w-6 rounded-full object-cover mr-2"
          />
          <span className="text-sm font-medium truncate text-foreground">{post.user.name}</span>
        </div>
        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {post.caption}
          </p>
        )}
      </div>
    </div>
  );
};

export default PostCard;
