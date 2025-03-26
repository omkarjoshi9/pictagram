"use client";

import { useTheme } from "@/hooks/use-theme";
import { HiSun, HiMoon } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="mr-2 relative w-9 h-9 rounded-full"
    >
      <span className="sr-only">Toggle theme</span>
      <span className="absolute">
        {theme === "light" ? (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <HiSun className="h-5 w-5 text-primary" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <HiMoon className="h-5 w-5 text-primary" />
          </motion.div>
        )}
      </span>
    </Button>
  );
}