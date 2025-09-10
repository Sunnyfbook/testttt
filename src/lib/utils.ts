import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates fileId to prevent injection attacks
 * Allows alphanumeric characters, hyphens, underscores, and dots
 */
export function validateFileId(fileId: string | null): fileId is string {
  if (!fileId || typeof fileId !== 'string') {
    return false;
  }
  
  // Check length (reasonable limits)
  if (fileId.length < 1 || fileId.length > 100) return false;
  
  // Allow only safe characters: alphanumeric, hyphens, underscores, dots
  const safePattern = /^[a-zA-Z0-9_.-]+$/;
  
  // Prevent path traversal and other dangerous patterns
  const dangerousPatterns = ['..', '/', '\\', '%', '<', '>', '"', "'", '&', ';', '|', '`', '$'];
  
  return safePattern.test(fileId) && 
         !dangerousPatterns.some(pattern => fileId.includes(pattern));
}

/**
 * Sanitizes a string to prevent XSS attacks
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.replace(/[<>\"'&]/g, function(match) {
    const escape: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return escape[match];
  });
}

/**
 * Sanitizes URL parameter by removing dangerous characters
 */
export function sanitizeUrlParam(param: string): string {
  if (!param || typeof param !== 'string') {
    return '';
  }
  
  return param.replace(/[^a-zA-Z0-9._-]/g, '');
}