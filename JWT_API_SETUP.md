# JWT-Based API Architecture Setup

This document explains the new JWT-based API architecture for secure React Native to Next.js communication.

## Architecture Overview

```
React Native App → Next.js API (JWT Auth) → Appwrite Database
```

**Benefits:**

- ✅ API keys stay secure on server
- ✅ Token-based authentication for mobile
- ✅ App Store ready security
- ✅ Scalable backend architecture

## Setup Instructions

### 1. Environment Variables

Add to your `.env.local` file:

```bash
# JWT Secret (generate a strong random string)
JWT_SECRET="your-jwt-secret-key-here-make-it-long-and-random"

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. API Authentication Flow

#### Sign Up/Sign In

```typescript
// React Native request
const response = await ApiClient.signIn({
  email: "user@example.com",
  password: "password"
});

// Returns:
{
  success: true,
  data: {
    user: { id, email, username, name, createdAt, updatedAt },
    accessToken: "jwt-token-here",
    expiresIn: 604800 // 7 days in seconds
  }
}
```

#### Authenticated Requests

All API requests now include JWT token automatically:

```typescript
// Authorization: Bearer <jwt-token>
const habits = await ApiClient.getHabits();
```

### 3. Protected API Routes

All API routes (except auth) now require JWT authentication:

- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/[id]` - Update habit
- `DELETE /api/habits/[id]` - Delete habit
- `POST /api/habits/[id]/completions` - Complete habit
- `GET /api/habits/[id]/completions` - Get habit completions
- `GET /api/completions` - Get all completions

### 4. Error Handling

The API now returns consistent error responses:

```typescript
{
  success: false,
  error: "Specific error message",
  message: "User-friendly message"
}
```

#### Authentication Errors

- `401 Unauthorized` - Invalid or expired token
- Token is automatically cleared from React Native storage

## React Native Client Updates

### Automatic Token Management

- Tokens stored securely in AsyncStorage
- Automatically included in API requests
- Auto-cleared on 401 errors

### Updated API Methods

```typescript
// All methods now use JWT authentication
await ApiClient.signIn(data);
await ApiClient.signUp(data);
await ApiClient.getHabits(); // No userId needed
await ApiClient.createHabit(data); // No userId needed
await ApiClient.updateHabit(id, data); // No userId needed
```

## Security Features

### JWT Token

- **Expiry**: 7 days
- **Payload**: userId, email, username, sessionId
- **Secret**: Server-side only (never exposed to client)

### Middleware Protection

- All API routes protected with `withAuth()` wrapper
- Automatic token validation
- User context injection

### Error Security

- No sensitive data in error messages
- Consistent error format
- Automatic session cleanup on auth failure

## Development vs Production

### Development

- JWT_SECRET can be any string for testing
- Detailed error logging enabled

### Production

- **MUST** use cryptographically secure JWT_SECRET
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Error logging filtered for security

## Migration from Direct Appwrite

If you were using direct Appwrite authentication before:

1. ✅ **Remove** direct Appwrite auth calls from React Native
2. ✅ **Update** to use ApiClient methods instead
3. ✅ **Remove** userId parameters (now from JWT)
4. ✅ **Update** error handling for new response format

## Testing the Setup

1. **Start Next.js server**: `npm run dev`
2. **Test authentication**: Use the `AuthTest` component
3. **Verify API calls**: Check network tab for `Authorization: Bearer` headers
4. **Test error handling**: Try invalid tokens

## Troubleshooting

### "Cannot find module 'jsonwebtoken'"

```bash
cd nextjs-habit-tracker
npm install jsonwebtoken @types/jsonwebtoken
```

### "JWT Secret required"

Add `JWT_SECRET` to your `.env.local` file

### "401 Unauthorized"

- Check if JWT_SECRET matches between sign and verify
- Verify token is being sent in Authorization header
- Check token expiry

### React Native connection issues

- Verify API URL in `config/api.ts`
- Check if Next.js server is running
- Test network connectivity

## Next Steps

1. **Add refresh tokens** for better security
2. **Implement rate limiting** for production
3. **Add API analytics** and monitoring
4. **Set up production deployment** with secure JWT secrets

---

This JWT-based architecture provides enterprise-grade security suitable for App Store deployment while maintaining excellent developer experience.
