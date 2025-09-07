import React from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Content Enhancer
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Transform your content with AI
              </p>
            </div>
          </motion.div>

          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
