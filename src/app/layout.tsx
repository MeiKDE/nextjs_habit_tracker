import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "Track your daily habits and build better routines",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
