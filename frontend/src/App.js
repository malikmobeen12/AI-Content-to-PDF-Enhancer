import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import InputCard from "./components/InputCard";
import OutputCard from "./components/OutputCard";
import EnhanceButton from "./components/EnhanceButton";
import { enhanceContent } from "./services/api";
import { AlertCircle, CheckCircle } from "lucide-react";

function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("summarize");
  const [enhancedContent, setEnhancedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEnhance = async () => {
    if (!text.trim()) {
      setError("Please enter some content to enhance");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    // Check if input is a URL
    const urlPattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
    const isUrl = urlPattern.test(text.trim());
    
    if (isUrl) {
      setSuccess("Fetching content from URL...");
    }

    try {
      const result = await enhanceContent(text, mode);
      setEnhancedContent(result.enhanced_content);
      setSuccess("Content enhanced successfully!");
    } catch (err) {
      setError(err.message || "Failed to enhance content. Please try again.");
      setEnhancedContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (newText) => {
    setText(newText);
    setError("");
    setSuccess("");
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    // Clear enhanced content when switching modes
    setEnhancedContent("");
    setError("");
    setSuccess("");
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Status Messages */}
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg border ${
                  error
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {error ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      error
                        ? "text-red-800 dark:text-red-200"
                        : "text-green-800 dark:text-green-200"
                    }`}
                  >
                    {error || success}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Input Section */}
            <InputCard
              onTextChange={handleTextChange}
              onModeChange={handleModeChange}
              selectedMode={mode}
              isLoading={isLoading}
            />

            {/* Enhance Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex justify-center"
            >
              <EnhanceButton
                onClick={handleEnhance}
                isLoading={isLoading}
                disabled={!text.trim()}
              />
            </motion.div>

            {/* Output Section */}
            <OutputCard
              content={enhancedContent}
              mode={mode}
              isLoading={isLoading}
              originalText={text}
            />
          </motion.div>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by AI • Built with React & Flask
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
