import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Check, Sparkles, AlertTriangle } from "lucide-react";
import { generatePDF } from "../utils/pdfGenerator";
import {
  processContent,
  validateContentCompleteness,
  cleanContentFormatting,
} from "../utils/contentProcessor";

const OutputCard = ({ content, mode, isLoading, originalText }) => {
  const [copied, setCopied] = useState(false);
  const [processedContent, setProcessedContent] = useState("");
  const [contentValidation, setContentValidation] = useState({
    isComplete: true,
    issues: [],
  });

  // Process content when it changes
  useEffect(() => {
    if (content && mode) {
      const cleaned = cleanContentFormatting(content);
      const processed = processContent(cleaned, mode);
      const validation = validateContentCompleteness(processed, mode);

      setProcessedContent(processed);
      setContentValidation(validation);
    }
  }, [content, mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedContent || content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownloadPDF = () => {
    if (processedContent || content) {
      generatePDF(processedContent || content, mode, originalText);
    }
  };

  const getModeLabel = (mode) => {
    const labels = {
      summarize: "Summary",
      expand: "Expanded Content",
      validate: "Validated Content",
    };
    return labels[mode] || "Enhanced Content";
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Processing...
          </h2>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer h-4 rounded w-full"></div>
          ))}
          <div className="shimmer h-4 rounded w-3/4"></div>
        </div>
      </motion.div>
    );
  }

  if (!content) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Ready to Enhance
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your content and select a mode to get started
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getModeLabel(mode)}
            </h2>
            {!contentValidation.isComplete && (
              <div className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>Content may be incomplete</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <motion.button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {copied ? "Copied!" : "Copy"}
            </span>
          </motion.button>

          <motion.button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Download PDF</span>
          </motion.button>
        </div>
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white font-sans leading-relaxed">
            {(processedContent || content).split("\n").map((line, index) => {
              // Handle different formatting patterns
              if (line.startsWith("Title:")) {
                return (
                  <div
                    key={index}
                    className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400"
                  >
                    {line.replace("Title:", "").trim()}
                  </div>
                );
              }
              if (line.startsWith("Summary:")) {
                return (
                  <div key={index} className="mb-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Summary:
                    </span>
                    <span className="ml-2">
                      {line.replace("Summary:", "").trim()}
                    </span>
                  </div>
                );
              }
              if (line.startsWith("VALIDATION REPORT")) {
                return (
                  <div
                    key={index}
                    className="font-bold text-lg mb-3 text-red-600 dark:text-red-400"
                  >
                    {line}
                  </div>
                );
              }
              if (line.startsWith("Claim:")) {
                return (
                  <div key={index} className="mb-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Claim:
                    </span>
                    <span className="ml-2">
                      {line.replace("Claim:", "").trim()}
                    </span>
                  </div>
                );
              }
              if (line.startsWith("Status:")) {
                return (
                  <div key={index} className="mb-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Status:
                    </span>
                    <span className="ml-2">
                      {line.replace("Status:", "").trim()}
                    </span>
                  </div>
                );
              }
              if (line.startsWith("Reasoning:")) {
                return (
                  <div key={index} className="mb-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Reasoning:
                    </span>
                    <span className="ml-2">
                      {line.replace("Reasoning:", "").trim()}
                    </span>
                  </div>
                );
              }
              if (line.startsWith("Source:")) {
                return (
                  <div key={index} className="mb-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Source:
                    </span>
                    <span className="ml-2">
                      {line.replace("Source:", "").trim()}
                    </span>
                  </div>
                );
              }
              if (line.trim() === "") {
                return <div key={index} className="h-2"></div>;
              }
              return <div key={index}>{line}</div>;
            })}
          </div>
        </div>

        {/* Content completeness indicator */}
        {!contentValidation.isComplete &&
          contentValidation.issues.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Content Quality Notice
                  </p>
                  <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                    {contentValidation.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
      </div>
    </motion.div>
  );
};

export default OutputCard;
