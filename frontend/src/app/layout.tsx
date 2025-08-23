import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ModalProvider } from "@/contexts/modal-context";
import { SchedulingProvider } from "@/contexts/scheduling-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoginModal } from "@/components/auth/login-modal";
import { NewEventModal } from "@/components/scheduling/new-event-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scheduler",
  description: "Smart scheduling that optimizes meeting times across time zones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <ModalProvider>
              <SchedulingProvider>
                <div className="min-h-screen bg-white">
                  {children}
                </div>
                <LoginModal />
                <NewEventModal />
              </SchedulingProvider>
            </ModalProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
