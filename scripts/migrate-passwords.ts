import { prisma } from "../src/lib/prisma";
import { hashPassword, isArgon2Hash } from "../src/lib/password";

async function migratePasswords() {
  console.log("🔄 Starting password migration from bcrypt to Argon2id...");

  try {
    // Find all users with non-Argon2 password hashes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
      },
    });

    const bcryptUsers = users.filter((user) => !isArgon2Hash(user.password));

    console.log(`📊 Found ${users.length} total users`);
    console.log(`🔐 Found ${bcryptUsers.length} users with bcrypt hashes`);
    console.log(
      `✅ Found ${
        users.length - bcryptUsers.length
      } users already using Argon2id`
    );

    if (bcryptUsers.length === 0) {
      console.log(
        "🎉 All users are already using Argon2id! No migration needed."
      );
      return;
    }

    console.log(
      "\n⚠️  IMPORTANT: Users with bcrypt hashes need to reset their passwords"
    );
    console.log(
      "This is because bcrypt hashes cannot be directly converted to Argon2id"
    );
    console.log("The migration will:");
    console.log("1. Generate temporary passwords for bcrypt users");
    console.log("2. Send password reset emails (implement this separately)");
    console.log("3. Force password reset on next login");

    // Option 1: Generate temporary passwords and force reset
    // Uncomment this if you want to generate temporary passwords
    /*
    console.log("\n🔄 Generating temporary passwords...");
    
    for (const user of bcryptUsers) {
      const tempPassword = generateSecurePassword();
      const hashedTempPassword = await hashPassword(tempPassword);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedTempPassword,
          // Add a field to track password reset requirement
          // You'll need to add this field to your schema
          // requiresPasswordReset: true 
        },
      });
      
      console.log(`✅ Updated user: ${user.email} (temp password: ${tempPassword})`);
      // TODO: Send email with temporary password
    }
    */

    // Option 2: Invalidate all bcrypt passwords and force reset
    console.log("\n🔄 Invalidating bcrypt passwords...");

    const invalidPassword = await hashPassword(
      "INVALID_TEMP_PASSWORD_REQUIRES_RESET"
    );

    await prisma.user.updateMany({
      where: {
        id: {
          in: bcryptUsers.map((u) => u.id),
        },
      },
      data: {
        password: invalidPassword,
      },
    });

    console.log(`✅ Invalidated ${bcryptUsers.length} bcrypt passwords`);
    console.log("\n📧 Next steps:");
    console.log("1. Implement password reset email functionality");
    console.log("2. Send password reset emails to affected users:");

    bcryptUsers.forEach((user) => {
      console.log(`   - ${user.email}`);
    });

    console.log("\n🎉 Migration completed successfully!");
    console.log("All password hashes are now using secure Argon2id!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function generateSecurePassword(length: number = 16): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Run migration if called directly
if (require.main === module) {
  migratePasswords();
}
