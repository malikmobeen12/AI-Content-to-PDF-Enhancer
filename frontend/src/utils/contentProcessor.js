// Content processing utilities to ensure complete output
// for expand and validate modes with no trailing lines or paragraphs

export const processContent = (content, mode) => {
  if (!content || typeof content !== "string") {
    return content;
  }

  // Clean up the content first
  let processedContent = content.trim();

  if (mode === "expand") {
    return processExpandContent(processedContent);
  } else if (mode === "validate") {
    return processValidateContent(processedContent);
  } else if (mode === "summarize") {
    return processSummarizeContent(processedContent);
  }

  return processedContent;
};

// Process expand mode content to ensure completeness
const processExpandContent = (content) => {
  // Split content into lines
  const lines = content.split("\n");
  const processedLines = [];
  let currentParagraph = [];
  let hasContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at the beginning
    if (!hasContent && !line) {
      continue;
    }

    // If we hit an empty line and have content, it's a paragraph break
    if (!line && currentParagraph.length > 0) {
      const paragraph = currentParagraph.join(" ").trim();
      if (paragraph) {
        processedLines.push(paragraph);
      }
      currentParagraph = [];
      hasContent = true;
    } else if (line) {
      currentParagraph.push(line);
      hasContent = true;
    }
  }

  // Add the last paragraph if it exists
  if (currentParagraph.length > 0) {
    const paragraph = currentParagraph.join(" ").trim();
    if (paragraph) {
      processedLines.push(paragraph);
    }
  }

  // Ensure we have substantial content
  if (processedLines.length === 0) {
    return content; // Return original if processing failed
  }

  // Join paragraphs with proper spacing
  return processedLines.join("\n\n");
};

// Process validate mode content to ensure completeness
const processValidateContent = (content) => {
  if (!content) return "";

  // Identify claims and their status with improved detection
  const lines = content.split("\n");
  const processedLines = [];
  let currentClaim = [];
  let inClaim = false;
  let hasContent = false;
  let claimCount = 0;
  let hasValidationHeader = false;

  // Check if content starts with VALIDATION REPORT header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toUpperCase() === "VALIDATION REPORT") {
      hasValidationHeader = true;
      processedLines.push(line);
      processedLines.push(""); // Add spacing after header
      hasContent = true;
      break;
    }
    if (line) break; // If we hit any non-empty line that's not the header, stop checking
  }

  // If no header found, add it
  if (!hasValidationHeader) {
    processedLines.push("VALIDATION REPORT");
    processedLines.push("");
    hasContent = true;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at the beginning and the VALIDATION REPORT header (already processed)
    if ((!hasContent && !line) || line.toUpperCase() === "VALIDATION REPORT") {
      continue;
    }

    // Improved claim detection with regex to handle numbered claims
    if (line.match(/^Claim\s*\d*\s*:/i) || line.match(/^\*\*Claim\s*\d*:\*\*/i)) {
      // Save previous claim if exists
      if (currentClaim.length > 0) {
        processedLines.push(...currentClaim);
        processedLines.push(""); // Add spacing between claims
      }
      
      claimCount++;
      // Ensure claims are numbered consistently and remove markdown formatting
      let claimText = line;
      if (line.match(/^\*\*Claim\s*\d*:\*\*/i)) {
        claimText = line.replace(/^\*\*Claim\s*\d*:\*\*/i, "").trim();
        currentClaim = [`Claim ${claimCount}: ${claimText}`];
      } else {
        claimText = line.replace(/^Claim\s*\d*\s*:/i, "").trim();
        currentClaim = [`Claim ${claimCount}: ${claimText}`];
      }
      inClaim = true;
      hasContent = true;
    } else if (inClaim && line) {
      // Continue building current claim
      // Remove markdown formatting from status lines
      if (line.includes("**Status:**")) {
        currentClaim.push(line.replace(/\*\*/g, ""));
      } else {
        currentClaim.push(line);
      }
      
      // Check for status indicators
      const isStatusLine = (
        line.includes("VERIFIED") ||
        line.includes("FALSE") ||
        line.includes("PARTIALLY TRUE") ||
        line.includes("UNCERTAIN") ||
        line.includes("✅") ||
        line.includes("❌") ||
        line.includes("⚠️") ||
        line.includes("❓") ||
        line.includes("Status:")
      );
      
      if (isStatusLine) {
        currentClaim.push(""); // Add extra spacing after status
        inClaim = false;
      }
    } else if (inClaim && !line) {
      // End of claim, add spacing
      currentClaim.push("");
      inClaim = false;
    } else if (line) {
      // Regular content line
      processedLines.push(line);
      hasContent = true;
    }
  }

  // Add the last claim if it exists
  if (currentClaim.length > 0) {
    processedLines.push(...currentClaim);
  }

  // Ensure we have content
  if (processedLines.length === 0) {
    return content; // Return original if processing failed
  }

  // Clean up trailing empty lines
  while (
    processedLines.length > 0 &&
    !processedLines[processedLines.length - 1].trim()
  ) {
    processedLines.pop();
  }

  // Add conclusion if it seems to be missing
  const lastLine = processedLines[processedLines.length - 1].toLowerCase();
  if (!lastLine.includes("conclusion") && !lastLine.includes("summary") && !lastLine.endsWith(".")) {
    processedLines.push("");
    processedLines.push("This completes the validation report.");
  }

  return processedLines.join("\n");
};

// Process summarize mode content to ensure completeness
const processSummarizeContent = (content) => {
  const lines = content.split("\n");
  const processedLines = [];
  let hasContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at the beginning
    if (!hasContent && !line) {
      continue;
    }

    if (line) {
      processedLines.push(line);
      hasContent = true;
    } else if (hasContent) {
      // Only add empty lines if we've already seen content
      processedLines.push("");
    }
  }

  // Clean up trailing empty lines
  while (
    processedLines.length > 0 &&
    !processedLines[processedLines.length - 1].trim()
  ) {
    processedLines.pop();
  }

  return processedLines.join("\n");
};

// Validate that content is complete (no abrupt endings)
export const validateContentCompleteness = (content, mode) => {
  if (!content || typeof content !== "string") {
    return { isComplete: false, issues: ["No content provided"] };
  }

  const trimmedContent = content.trim();
  const issues = [];

  // Check for common incomplete patterns
  if (trimmedContent.endsWith("...") || trimmedContent.endsWith("…")) {
    issues.push("Content appears to be truncated (ends with ellipsis)");
  }

  // Check for unclosed brackets or parentheses
  const openBrackets = (trimmedContent.match(/\[/g) || []).length;
  const closeBrackets = (trimmedContent.match(/\]/g) || []).length;
  const openParens = (trimmedContent.match(/\(/g) || []).length;
  const closeParens = (trimmedContent.match(/\)/g) || []).length;
  const openCurly = (trimmedContent.match(/\{/g) || []).length;
  const closeCurly = (trimmedContent.match(/\}/g) || []).length;

  if (openBrackets > closeBrackets) {
    issues.push(`Missing ${openBrackets - closeBrackets} closing bracket(s) ']'`);
  }

  if (openParens > closeParens) {
    issues.push(
      `Missing ${openParens - closeParens} closing parenthesis/parentheses ')'`
    );
  }

  if (openCurly > closeCurly) {
    issues.push(`Missing ${openCurly - closeCurly} closing curly brace(s) '}'`);
  }

  if (mode === "expand") {
    // Check for incomplete sentences in expand mode
    const sentences = trimmedContent.split(/[.!?]/);
    const lastSentence = sentences[sentences.length - 1].trim();
    if (lastSentence && !lastSentence.match(/[.!?]$/)) {
      issues.push(
        "Content may be incomplete (last sentence not properly ended)"
      );
    }
    
    // Check for minimum content length
    if (trimmedContent.length < 100) {
      issues.push("Expanded content seems unusually short");
    }
  }

  if (mode === "validate") {
    // Check for standard validation format
    const claimMatches = trimmedContent.match(/Claim\s*\d*\s*:/gi) || [];
    if (claimMatches.length === 0) {
      issues.push("Validation report is missing claim statements");
    }

    // Check for status indicators with improved detection
    const statusIndicators = [
      "VERIFIED", "FALSE", "PARTIALLY TRUE", "UNCERTAIN",
      "✅", "❌", "⚠️", "❓"
    ];
    
    const hasStatusIndicator = statusIndicators.some(indicator => 
      trimmedContent.includes(indicator)
    );
    
    if (!hasStatusIndicator) {
      issues.push("Validation report is missing status indicators");
    }
    
    // Check if number of claims matches number of statuses
    const statusMatches = trimmedContent.match(/VERIFIED|FALSE|PARTIALLY TRUE|UNCERTAIN|✅|❌|⚠️|❓/g) || [];
    if (claimMatches.length > statusMatches.length) {
      issues.push(`${claimMatches.length - statusMatches.length} claim(s) may be missing status indicators`);
    }
  } else if (mode === "summarize") {
    // Check for minimum content length
    if (trimmedContent.length < 50) {
      issues.push("Summary seems unusually short");
    }
    
    // Check for expected summary sections
    if (!trimmedContent.toLowerCase().includes("summary") && 
        !trimmedContent.toLowerCase().includes("key point")) {
      issues.push("Summary may be missing standard sections");
    }
  }

  return {
    isComplete: issues.length === 0,
    issues: issues,
  };
};

// Clean up content formatting
export const cleanContentFormatting = (content) => {
  if (!content || typeof content !== "string") {
    return content;
  }

  return content
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
    .replace(/[ \t]+$/gm, "") // Remove trailing spaces from each line
    .replace(/^\s+|\s+$/g, "") // Remove leading/trailing whitespace
    .replace(/\n\s*\n\s*\n/g, "\n\n"); // Clean up excessive spacing
};
