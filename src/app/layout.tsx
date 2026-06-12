import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Clientora — Client & Freelancer Workspace",
  description: "Manage clients, projects, workspaces, and documents in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${plusJakarta.variable} antialiased font-sans bg-white text-text-primary`}>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <ToastProvider>
          <ErrorBoundary><div id="main-content" role="main">{children}</div></ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}
