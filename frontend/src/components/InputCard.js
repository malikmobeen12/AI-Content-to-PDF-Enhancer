import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Link, Type, X } from "lucide-react";

const InputCard = ({ onTextChange, onModeChange, selectedMode, isLoading }) => {
  const [inputType, setInputType] = useState("text");
  const [url, setUrl] = useState("");
  const [textContent, setTextContent] = useState("");

  const handleInputTypeChange = (type) => {
    setInputType(type);
    if (type === "url") {
      onTextChange(url);
    } else {
      onTextChange(textContent);
    }
  };

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    onTextChange(value);
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setTextContent(value);
    onTextChange(value);
  };
  
  const handleClearInput = () => {
    if (inputType === "text") {
      setTextContent("");
    } else {
      setUrl("");
    }
    onTextChange("");
  };

  const modes = [
    {
      id: "summarize",
      label: "Summarize",
      description: "Create a concise summary",
    },
    {
      id: "expand",
      label: "Expand",
      description: "Add details and elaboration",
    },
    {
      id: "validate",
      label: "Validate",
      description: "Review and improve content",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Input Content
        </h2>

        {/* Input Type Toggle */}
        <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleInputTypeChange("text")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              inputType === "text"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>
          <button
            onClick={() => handleInputTypeChange("url")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              inputType === "url"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Link className="w-4 h-4" />
            <span>URL</span>
          </button>
        </div>

        {/* Input Field with Clear Button */}
        <div className="relative">
          {inputType === "text" ? (
            <textarea
              value={textContent}
              onChange={handleTextChange}
              placeholder="Paste your text content here..."
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="Enter URL to fetch content from..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          )}
          
          {/* Clear button */}
          {((inputType === "text" && textContent) || (inputType === "url" && url)) && (
            <button 
              onClick={handleClearInput}
              className="absolute right-3 top-3 p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              disabled={isLoading}
              title="Clear input"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Enhancement Mode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modes.map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              disabled={isLoading}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedMode === mode.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {mode.label}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {mode.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default InputCard;
