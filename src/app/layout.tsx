import "@/styles/globals.css";
import "@/lib/passive-events";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "Track your daily habits and build better routines",
  openGraph: {
    title: "Habit Tracker",
    description: "Track your daily habits and build better routines",
    type: "website",
    url: "https://your-production-url.com/", // TODO: update to your real URL
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Habit Tracker App Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Habit Tracker",
    description: "Track your daily habits and build better routines",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
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
