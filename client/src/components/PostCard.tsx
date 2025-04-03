import React from "react";
import { HiOutlineHeart, HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { motion } from "framer-motion";

// Define the interfaces needed for the PostCard
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

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  // Default placeholder values when data is not available
  const imageUrl = post.imageUrl || "/placeholder-image.jpg";
  const username = post.user?.username || "Unknown user";
  const profilePic = post.user?.profilePic || "/placeholder-avatar.jpg";
  
  return (
    <div 
      className="post-card relative overflow-hidden rounded-lg shadow-sm border border-border group cursor-pointer bg-card"
      onClick={onClick}
    >
      <div className="aspect-square">
        <img 
          src={imageUrl} 
          alt={post.caption} 
          className="object-cover w-full h-full"
        />
        <motion.div 
          className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center space-x-4 text-white"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* We don't have likes count in our new data structure yet */}
          <div className="flex items-center bg-black/30 px-2 py-1 rounded">
            <HiOutlineHeart className="h-5 w-5 mr-1" />
            <span>0</span>
          </div>
          {/* We don't have comments count in our new data structure yet */}
          <div className="flex items-center bg-black/30 px-2 py-1 rounded">
            <HiOutlineChatBubbleOvalLeft className="h-5 w-5 mr-1" />
            <span>0</span>
          </div>
        </motion.div>
      </div>
      <div className="p-3">
        <div className="flex items-center mb-1">
          <img 
            src={profilePic}
            alt={username} 
            className="h-6 w-6 rounded-full object-cover mr-2"
          />
          <span className="text-sm font-medium truncate text-foreground">{username}</span>
        </div>
        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {post.caption}
          </p>
        )}
        {post.feeling && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            Feeling: {post.feeling}
          </p>
        )}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.categories.map((category, index) => (
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
    </div>
  );
};

export default PostCard;
