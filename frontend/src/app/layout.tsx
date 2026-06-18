import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "AI-Powered Code Review Assistant",
  description: "Upload codebases, explore directory trees, and receive structured AI reviews for security, performance, and code quality.",
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en" className="h-full dark antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-black text-[#f3f4f6] flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
