#!/usr/bin/env node

const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

console.log("🔧 Setting up JWT Authentication...\n");

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(32).toString("hex");
console.log("✅ Generated secure JWT secret");

// Check if .env.local exists
const envPath = path.join(__dirname, ".env.local");
const envExamplePath = path.join(__dirname, "env.local.example");

let envContent = "";

if (fs.existsSync(envPath)) {
  // Read existing .env.local
  envContent = fs.readFileSync(envPath, "utf8");
  console.log("✅ Found existing .env.local file");

  // Check if JWT_SECRET already exists
  if (envContent.includes("JWT_SECRET=")) {
    console.log("⚠️  JWT_SECRET already exists in .env.local");
    console.log("   If you want to replace it, manually update the file with:");
    console.log(`   JWT_SECRET="${jwtSecret}"`);
  } else {
    // Add JWT_SECRET to existing file
    envContent += `\n# JWT Secret for API authentication\nJWT_SECRET="${jwtSecret}"\n`;
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Added JWT_SECRET to existing .env.local");
  }
} else {
  // Copy from example and add JWT_SECRET
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf8");
    // Replace the placeholder JWT_SECRET
    envContent = envContent.replace(
      'JWT_SECRET="your-jwt-secret-key-here-make-it-long-and-random"',
      `JWT_SECRET="${jwtSecret}"`
    );
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Created .env.local from example with JWT_SECRET");
  } else {
    // Create minimal .env.local
    envContent = `# JWT Secret for API authentication\nJWT_SECRET="${jwtSecret}"\n`;
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Created new .env.local with JWT_SECRET");
  }
}

console.log("\n🎉 JWT Authentication setup complete!");
console.log("\nNext steps:");
console.log("1. Make sure your Appwrite environment variables are set");
console.log("2. Start the Next.js server: npm run dev");
console.log("3. Test the API with your React Native app");
console.log("\nYour JWT Secret (save this securely):");
console.log(`${jwtSecret}`);
console.log("\n📖 See JWT_API_SETUP.md for detailed documentation");
