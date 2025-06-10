#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Validating Appwrite Setup...\n");

// Check if .env.local exists
const envPath = path.join(process.cwd(), ".env.local");
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log("❌ .env.local file not found");
  console.log(
    "📝 Please copy env.local.example to .env.local and fill in your Appwrite credentials\n"
  );
  process.exit(1);
}

// Try to load environment variables
let envVars = {};
try {
  // Try to use dotenv if available
  try {
    require("dotenv").config({ path: envPath });
    envVars = process.env;
  } catch (dotenvError) {
    // Fallback: manually parse .env.local file
    console.log(
      "📝 Note: Install dotenv for better environment variable handling: npm install dotenv"
    );
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          let value = valueParts.join("=").trim();
          // Remove quotes if present
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          envVars[key.trim()] = value;
        }
      }
    });
  }
} catch (error) {
  console.log("❌ Error reading environment variables:", error.message);
  process.exit(1);
}

const requiredEnvVars = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
  "NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID",
  "NEXT_PUBLIC_APPWRITE_HABITS_COLLECTION_ID",
  "NEXT_PUBLIC_APPWRITE_HABIT_COMPLETIONS_COLLECTION_ID",
  "APPWRITE_API_KEY",
];

let allValid = true;

console.log("📋 Checking environment variables:");
requiredEnvVars.forEach((varName) => {
  const value = envVars[varName];
  if (!value || value.includes("your-") || value.includes("here")) {
    console.log(`❌ ${varName}: Not configured`);
    allValid = false;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log("\n📦 Checking dependencies:");

// Check if required packages are installed
const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const requiredPackages = [
  "appwrite",
  "node-appwrite",
  "next",
  "react",
  "typescript",
  "zod",
];

requiredPackages.forEach((pkg) => {
  if (dependencies[pkg]) {
    console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
  } else {
    console.log(`❌ ${pkg}: Not installed`);
    allValid = false;
  }
});

console.log("\n🔧 Setup recommendations:");

if (!allValid) {
  console.log("❌ Setup incomplete. Please address the issues above.");
  console.log("\n📚 Setup steps:");
  console.log("1. Copy env.local.example to .env.local");
  console.log("2. Create an Appwrite project at https://cloud.appwrite.io");
  console.log("3. Run: npm install  (to install dependencies)");
  console.log("4. Run: npm run setup  (to create collections)");
  console.log("5. Fill in your .env.local with the generated values");
  console.log("6. Run: npm run dev");
} else {
  console.log("✅ All checks passed! Your setup looks good.");
  console.log("\n🚀 You can now run: npm run dev");
}

console.log("\n📖 For detailed setup instructions, see SETUP_GUIDE.md");
