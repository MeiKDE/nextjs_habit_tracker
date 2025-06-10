# Appwrite Collections Setup Guide

This guide will help you create all the required Appwrite collections for your habit tracker application.

## Prerequisites

1. An Appwrite account (cloud.appwrite.io or self-hosted)
2. A project created in Appwrite
3. A database created in your Appwrite project
4. Node.js installed on your system

## Step 1: Get Your Appwrite Credentials

1. **Project ID**: Go to your Appwrite console → Settings → copy your Project ID
2. **Database ID**: Go to Databases → copy your Database ID
3. **API Key**: Go to Settings → API Keys → Create a new key with these scopes:
   - `databases.read`
   - `databases.write`
   - `collections.read`
   - `collections.write`
   - `attributes.read`
   - `attributes.write`
   - `indexes.read`
   - `indexes.write`

## Step 2: Configure the Setup Script

1. Open `create-appwrite-collections.js`
2. Replace the following values with your actual credentials:
   ```javascript
   const APPWRITE_PROJECT_ID = "your_actual_project_id";
   const APPWRITE_API_KEY = "your_actual_api_key";
   const DATABASE_ID = "your_actual_database_id";
   ```

## Step 3: Install Dependencies

```bash
npm install node-appwrite
```

## Step 4: Run the Setup Script

```bash
node create-appwrite-collections.js
```

This script will create three collections:

### 1. Users Collection (`users`)

**Attributes:**

- `email` (string, required, unique)
- `username` (string, required, unique)
- `name` (string, optional)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

**Indexes:**

- `email_unique` (unique on email)
- `username_unique` (unique on username)

### 2. Habits Collection (`habits`)

**Attributes:**

- `title` (string, required)
- `description` (string, optional)
- `frequency` (enum: DAILY, WEEKLY, MONTHLY, required)
- `streakCount` (integer, required, default: 0)
- `lastCompleted` (datetime, optional)
- `color` (string, required)
- `isActive` (boolean, required, default: true)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)
- `userId` (string, required)

**Indexes:**

- `user_habits` (key on userId)

### 3. Habit Completions Collection (`habit_completions`)

**Attributes:**

- `completedAt` (datetime, required)
- `notes` (string, optional)
- `createdAt` (datetime, required)
- `habitId` (string, required)

**Indexes:**

- `habit_completions` (key on habitId)
- `completion_date` (key on completedAt)

## Step 5: Configure Environment Variables

Create a `.env.local` file in your project root with:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here

# Collection IDs
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_HABITS_COLLECTION_ID=habits
NEXT_PUBLIC_APPWRITE_HABIT_COMPLETIONS_COLLECTION_ID=habit_completions

# Server-side API key
APPWRITE_API_KEY=your_server_api_key_here

# Next.js
NODE_ENV=development
```

## Step 6: Set Collection Permissions

The script automatically sets these permissions for all collections:

- **Create**: Users (authenticated users can create documents)
- **Read**: Users (users can read their own documents)
- **Update**: Users (users can update their own documents)
- **Delete**: Users (users can delete their own documents)

## Step 7: Test Your Setup

1. Start your Next.js application:

   ```bash
   npm run dev
   ```

2. Try to:
   - Register a new user account
   - Create a new habit
   - Mark a habit as complete

## Troubleshooting

### Common Errors

1. **"Collection with the requested ID could not be found"**

   - Make sure the setup script ran successfully
   - Check that your collection IDs in `.env.local` match the ones created
   - Verify your database ID is correct

2. **"Insufficient permissions"**

   - Ensure your API key has all the required scopes
   - Check that collection permissions are set correctly

3. **"Document with the requested ID could not be found"**

   - This usually means the document doesn't exist or you don't have permission to access it
   - Check that the user is authenticated and owns the document

4. **"Attribute already exists"**
   - The script tries to create attributes that already exist
   - You can safely ignore this error or delete and recreate the collection

### Manual Setup (Alternative)

If the script doesn't work, you can create the collections manually in the Appwrite console:

1. Go to your Appwrite console → Databases → Your Database
2. Click "Create Collection"
3. Use the collection IDs and attributes listed above
4. Set the permissions as described

## Security Considerations

- Never expose your API key in client-side code
- Use environment variables for all sensitive data
- The API key should only be used for server-side operations
- Client-side operations use the user's session for authentication

## Next Steps

After successful setup:

1. Your habit tracker should work without collection errors
2. Users can register and create habits
3. All data is stored securely in Appwrite
4. You can view/manage data through the Appwrite console

For any issues, check the Appwrite console logs and your browser's developer console for error messages.
