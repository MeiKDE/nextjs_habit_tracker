import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const useAuthValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { user, loading } = useAuth();

  const validateEmail = useCallback((email: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, error: "Email is required" };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Please enter a valid email address" };
    }
    return { isValid: true };
  }, []);

  const validatePassword = useCallback((password: string): ValidationResult => {
    if (!password) {
      return { isValid: false, error: "Password is required" };
    }
    if (password.length < 6) {
      return {
        isValid: false,
        error: "Password must be at least 6 characters long",
      };
    }
    if (password.length > 128) {
      return {
        isValid: false,
        error: "Password must be less than 128 characters",
      };
    }
    return { isValid: true };
  }, []);

  const validateUsername = useCallback((username: string): ValidationResult => {
    if (!username) {
      return { isValid: false, error: "Username is required" };
    }
    if (username.length < 3) {
      return {
        isValid: false,
        error: "Username must be at least 3 characters long",
      };
    }
    if (username.length > 20) {
      return {
        isValid: false,
        error: "Username must be less than 20 characters",
      };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return {
        isValid: false,
        error:
          "Username can only contain letters, numbers, hyphens, and underscores",
      };
    }
    return { isValid: true };
  }, []);

  const validateSignUpForm = useCallback(
    (
      email: string,
      username: string,
      password: string,
      confirmPassword: string
    ): ValidationResult => {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) return emailValidation;

      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) return usernameValidation;

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) return passwordValidation;

      if (password !== confirmPassword) {
        return { isValid: false, error: "Passwords do not match" };
      }

      return { isValid: true };
    },
    [validateEmail, validateUsername, validatePassword]
  );

  const validateSignInForm = useCallback(
    (email: string, password: string): ValidationResult => {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) return emailValidation;

      if (!password) {
        return { isValid: false, error: "Password is required" };
      }

      return { isValid: true };
    },
    [validateEmail]
  );

  const isAuthenticated = useCallback((): boolean => {
    return !loading && !!user;
  }, [loading, user]);

  const requireAuth = useCallback((): boolean => {
    if (loading) return false;
    return !!user;
  }, [loading, user]);

  return {
    isValidating,
    setIsValidating,
    validateEmail,
    validatePassword,
    validateUsername,
    validateSignUpForm,
    validateSignInForm,
    isAuthenticated,
    requireAuth,
  };
};
