import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

const EnhanceButton = ({ onClick, isLoading, disabled }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
        disabled || isLoading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
      }`}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center justify-center space-x-2">
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Enhancing...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Enhance Content</span>
          </>
        )}
      </div>

      {!disabled && !isLoading && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 opacity-0"
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
};

export default EnhanceButton;
