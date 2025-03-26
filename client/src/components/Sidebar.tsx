import React from "react";
import { Link, useLocation } from "wouter";
import { 
  HiOutlineHome, 
  HiOutlineSearch, 
  HiOutlineBell, 
  HiOutlineChatAlt, 
  HiOutlineBookmark, 
  HiOutlineCog 
} from "react-icons/hi";

interface SidebarProps {
  activePage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage }) => {
  const [location] = useLocation();

  const navItems = [
    { name: "home", path: "/", icon: HiOutlineHome, label: "Home" },
    { name: "explore", path: "/explore", icon: HiOutlineSearch, label: "Explore" },
    { name: "notifications", path: "/notifications", icon: HiOutlineBell, label: "Notifications" },
    { name: "messages", path: "/messages", icon: HiOutlineChatAlt, label: "Messages" },
    { name: "bookmarks", path: "/bookmarks", icon: HiOutlineBookmark, label: "Bookmarks" },
    { name: "settings", path: "/settings", icon: HiOutlineCog, label: "Settings" },
  ];

  return (
    <div className="md:w-1/5 py-6 pr-4 hidden md:block">
      <div className="space-y-1">
        <div className="flex items-center mb-6">
          <img 
            src="/assets/image/avatar_default.jpg"
            alt="Profile" 
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <p className="text-sm font-medium">Omkar Joshi</p>
            <p className="text-xs text-muted">@omkarjoshi</p>
          </div>
        </div>
        
        {navItems.map((item) => (
          <Link key={item.name} href={item.path}>
            <a className={`flex items-center px-3 py-2 rounded-md ${
              activePage === item.name ? "bg-pink-light" : "hover:bg-secondary"
            }`}>
              <item.icon className={`h-5 w-5 mr-3 ${
                activePage === item.name ? "text-primary" : "text-muted"
              }`} />
              <span className={`text-sm font-medium ${
                activePage === item.name ? "text-primary" : ""
              }`}>
                {item.label}
              </span>
            </a>
          </Link>
        ))}
      </div>
      
      <Link href="/create">
        <a className="block mt-6 w-full py-2 bg-primary text-white rounded-full text-sm font-medium text-center">
          Create Post
        </a>
      </Link>
    </div>
  );
};

export default Sidebar;
