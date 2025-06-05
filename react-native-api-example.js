// React Native API Helper Example
// This shows how to connect your React Native app to the Next.js auth endpoints

const API_BASE_URL = "http://localhost:3000"; // Change to your deployed URL in production

// For React Native, you might need different URLs:
// iOS Simulator: 'http://localhost:3000'
// Android Emulator: 'http://10.0.2.2:3000'
// Physical device: 'http://YOUR_COMPUTER_IP:3000'

class AuthAPI {
  // Sign up a new user
  static async signup(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          username: userData.username,
          password: userData.password,
          name: userData.name, // optional
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // Store the token in AsyncStorage for future requests
      if (data.success && data.data.accessToken) {
        await this.storeToken(data.data.accessToken);
      }

      return data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  // Sign in existing user
  static async signin(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email, // can be email or username
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signin failed");
      }

      // Store the token in AsyncStorage for future requests
      if (data.success && data.data.accessToken) {
        await this.storeToken(data.data.accessToken);
      }

      return data;
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    }
  }

  // Store JWT token in AsyncStorage
  static async storeToken(token) {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem("accessToken", token);
    } catch (error) {
      console.error("Error storing token:", error);
    }
  }

  // Get stored JWT token
  static async getToken() {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem("accessToken");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Remove stored token (logout)
  static async removeToken() {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem("accessToken");
    } catch (error) {
      console.error("Error removing token:", error);
    }
  }

  // Make authenticated API requests to your other endpoints
  static async makeAuthenticatedRequest(endpoint, options = {}) {
    try {
      const token = await this.getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // This is how your JWT middleware expects it
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If token is invalid, redirect to login
        if (response.status === 401) {
          await this.removeToken();
          // Navigate to login screen here
        }
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("Authenticated request error:", error);
      throw error;
    }
  }
}

// Usage examples:

// 1. Sign up
/*
try {
  const result = await AuthAPI.signup({
    email: 'user@example.com',
    username: 'newuser',
    password: 'password123',
    name: 'John Doe'
  });
  console.log('Signup successful:', result.data);
  // Navigate to main app or dashboard
} catch (error) {
  console.error('Signup failed:', error.message);
  // Show error to user
}
*/

// 2. Sign in
/*
try {
  const result = await AuthAPI.signin({
    email: 'user@example.com', // or username
    password: 'password123'
  });
  console.log('Signin successful:', result.data);
  // Navigate to main app
} catch (error) {
  console.error('Signin failed:', error.message);
  // Show error to user
}
*/

// 3. Make authenticated requests to other endpoints
/*
try {
  const habits = await AuthAPI.makeAuthenticatedRequest('/api/habits');
  console.log('User habits:', habits);
} catch (error) {
  console.error('Failed to fetch habits:', error.message);
}
*/

export default AuthAPI;
