const { Client, Databases, Permission, Role } = require("node-appwrite");

// Configuration - UPDATE THESE VALUES
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "683db415003b8b011313"; // Replace with your actual project ID
const APPWRITE_API_KEY =
  "standard_5fba2bf07da42492757a004e9b92ddf0bbe44696ec3adfba4f2c344bbf697c98e0cbae7beee812b1e04a7338a74d48b9875165a69ab953f9bd7690b223d8f3dfa560128b0bc6f0f78a1f3b33fbac7aa9466bcbda557730e1d026dc0e8a253f952e5252dad48cd30c39e36e850da714b5ec0d17c73e35455312523ac897abb506"; // Replace with your API key
const DATABASE_ID = "683e6cb10010f47ea863"; // Replace with your database ID

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkCollectionExists(collectionId) {
  try {
    await databases.getCollection(DATABASE_ID, collectionId);
    return true;
  } catch (error) {
    return false;
  }
}

async function createCollectionSafely(collectionId, name, permissions) {
  const exists = await checkCollectionExists(collectionId);
  if (exists) {
    console.log(`⚠️  Collection "${name}" already exists, skipping creation`);
    return null;
  }

  try {
    const collection = await databases.createCollection(
      DATABASE_ID,
      collectionId,
      name,
      permissions
    );
    console.log(`✅ ${name} collection created`);
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️  Collection "${name}" already exists, skipping creation`);
      return null;
    }
    throw error;
  }
}

async function createAttributeSafely(
  collectionId,
  attributeId,
  createFunction
) {
  try {
    await createFunction();
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️  Attribute "${attributeId}" already exists, skipping`);
    } else {
      console.error(
        `❌ Error creating attribute "${attributeId}":`,
        error.message
      );
    }
  }
}

async function createIndexSafely(collectionId, indexId, createFunction) {
  try {
    await createFunction();
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️  Index "${indexId}" already exists, skipping`);
    } else {
      console.error(`❌ Error creating index "${indexId}":`, error.message);
    }
  }
}

async function createCollections() {
  try {
    console.log("Starting Appwrite collections setup...\n");

    const permissions = [
      Permission.create(Role.users()),
      Permission.read(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ];

    // 1. Create Users Collection
    console.log("Creating Users collection...");
    await createCollectionSafely("users", "Users", permissions);

    // Add attributes to Users collection
    console.log("Creating Users collection attributes...");
    await createAttributeSafely("users", "email", () =>
      databases.createStringAttribute(DATABASE_ID, "users", "email", 255, true)
    );
    await createAttributeSafely("users", "username", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        "users",
        "username",
        255,
        true
      )
    );
    await createAttributeSafely("users", "name", () =>
      databases.createStringAttribute(DATABASE_ID, "users", "name", 255, false)
    );
    await createAttributeSafely("users", "createdAt", () =>
      databases.createDatetimeAttribute(DATABASE_ID, "users", "createdAt", true)
    );
    await createAttributeSafely("users", "updatedAt", () =>
      databases.createDatetimeAttribute(DATABASE_ID, "users", "updatedAt", true)
    );
    console.log("✅ Users collection attributes processed");

    // Create indexes for unique fields
    console.log("Creating Users collection indexes...");
    await createIndexSafely("users", "email_unique", () =>
      databases.createIndex(DATABASE_ID, "users", "email_unique", "unique", [
        "email",
      ])
    );
    await createIndexSafely("users", "username_unique", () =>
      databases.createIndex(DATABASE_ID, "users", "username_unique", "unique", [
        "username",
      ])
    );
    console.log("✅ Users collection indexes processed");

    // 2. Create Habits Collection
    console.log("\nCreating Habits collection...");
    await createCollectionSafely("habits", "Habits", permissions);

    // Add attributes to Habits collection
    console.log("Creating Habits collection attributes...");
    await createAttributeSafely("habits", "title", () =>
      databases.createStringAttribute(DATABASE_ID, "habits", "title", 255, true)
    );
    await createAttributeSafely("habits", "description", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        "habits",
        "description",
        1000,
        false
      )
    );
    await createAttributeSafely("habits", "frequency", () =>
      databases.createEnumAttribute(
        DATABASE_ID,
        "habits",
        "frequency",
        ["DAILY", "WEEKLY", "MONTHLY"],
        true
      )
    );
    await createAttributeSafely("habits", "streakCount", () =>
      databases.createIntegerAttribute(
        DATABASE_ID,
        "habits",
        "streakCount",
        true,
        0,
        undefined
      )
    );
    await createAttributeSafely("habits", "lastCompleted", () =>
      databases.createDatetimeAttribute(
        DATABASE_ID,
        "habits",
        "lastCompleted",
        false
      )
    );
    await createAttributeSafely("habits", "color", () =>
      databases.createStringAttribute(DATABASE_ID, "habits", "color", 7, true)
    );
    await createAttributeSafely("habits", "isActive", () =>
      databases.createBooleanAttribute(DATABASE_ID, "habits", "isActive", true)
    );
    await createAttributeSafely("habits", "createdAt", () =>
      databases.createDatetimeAttribute(
        DATABASE_ID,
        "habits",
        "createdAt",
        true
      )
    );
    await createAttributeSafely("habits", "updatedAt", () =>
      databases.createDatetimeAttribute(
        DATABASE_ID,
        "habits",
        "updatedAt",
        true
      )
    );
    await createAttributeSafely("habits", "userId", () =>
      databases.createStringAttribute(DATABASE_ID, "habits", "userId", 36, true)
    );
    console.log("✅ Habits collection attributes processed");

    // Create index for user habits
    console.log("Creating Habits collection indexes...");
    await createIndexSafely("habits", "user_habits", () =>
      databases.createIndex(DATABASE_ID, "habits", "user_habits", "key", [
        "userId",
      ])
    );
    console.log("✅ Habits collection indexes processed");

    // 3. Create Habit Completions Collection
    console.log("\nCreating Habit Completions collection...");
    await createCollectionSafely(
      "habit_completions",
      "Habit Completions",
      permissions
    );

    // Add attributes to Habit Completions collection
    console.log("Creating Habit Completions collection attributes...");
    await createAttributeSafely("habit_completions", "completedAt", () =>
      databases.createDatetimeAttribute(
        DATABASE_ID,
        "habit_completions",
        "completedAt",
        true
      )
    );
    await createAttributeSafely("habit_completions", "notes", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        "habit_completions",
        "notes",
        1000,
        false
      )
    );
    await createAttributeSafely("habit_completions", "createdAt", () =>
      databases.createDatetimeAttribute(
        DATABASE_ID,
        "habit_completions",
        "createdAt",
        true
      )
    );
    await createAttributeSafely("habit_completions", "habitId", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        "habit_completions",
        "habitId",
        36,
        true
      )
    );
    console.log("✅ Habit Completions collection attributes processed");

    // Create index for habit completions
    console.log("Creating Habit Completions collection indexes...");
    await createIndexSafely("habit_completions", "habit_completions", () =>
      databases.createIndex(
        DATABASE_ID,
        "habit_completions",
        "habit_completions",
        "key",
        ["habitId"]
      )
    );
    await createIndexSafely("habit_completions", "completion_date", () =>
      databases.createIndex(
        DATABASE_ID,
        "habit_completions",
        "completion_date",
        "key",
        ["completedAt"]
      )
    );
    console.log("✅ Habit Completions collection indexes processed");

    console.log("\n🎉 Collection setup completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Update your .env.local file with these collection IDs:");
    console.log("   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users");
    console.log("   NEXT_PUBLIC_APPWRITE_HABITS_COLLECTION_ID=habits");
    console.log(
      "   NEXT_PUBLIC_APPWRITE_HABIT_COMPLETIONS_COLLECTION_ID=habit_completions"
    );
    console.log("2. Run: npm run validate-setup");
    console.log("3. Start your Next.js application: npm run dev");
  } catch (error) {
    console.error("❌ Error setting up collections:", error);
    console.log("\nTroubleshooting:");
    console.log("1. Make sure your API key has the correct permissions");
    console.log("2. Verify your project ID and database ID are correct");
    console.log("3. Check your Appwrite console for any existing collections");
    console.log(
      "4. Ensure your .env.local file has the correct Appwrite configuration"
    );
  }
}

// Run the setup
createCollections();
