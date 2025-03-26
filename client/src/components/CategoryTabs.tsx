import React from "react";
import { motion } from "framer-motion";

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  categories, 
  activeCategory, 
  setActiveCategory 
}) => {
  const formatCategoryName = (category: string) => {
    if (category === "ForYou") return "For You";
    return category;
  };

  return (
    <div className="border-b border-border mb-6 overflow-x-auto whitespace-nowrap">
      <div className="inline-flex">
        {categories.map((category) => (
          <button
            key={category}
            className={`relative px-4 py-2 text-sm font-medium ${
              activeCategory === category ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {formatCategoryName(category)}
            {activeCategory === category && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                layoutId="activeCategoryIndicator"
                initial={false}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
