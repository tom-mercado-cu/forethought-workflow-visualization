import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workflow Visualizer",
  description: "Visualize your chatbot workflows",
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
        <div className="h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col">
          <div className="flex-none p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Chatbot Workflow Visualizer
                </h1>
                <p className="text-slate-600">
                  Transform complex chatbot flows into clear, interactive
                  decision trees
                </p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
