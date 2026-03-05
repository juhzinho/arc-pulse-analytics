import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-client";
import { Sidebar } from "@/components/sidebar";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono"
});

export const metadata: Metadata = {
  title: "Arc Pulse Analytics",
  description: "On-chain analytics and forecasting for Arc Network"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} font-sans`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem("arc-theme");
                  var resolved = theme === "light" ? "light" : "dark";
                  document.documentElement.classList.toggle("dark", resolved === "dark");
                  document.documentElement.style.colorScheme = resolved;
                } catch (error) {}
              })();
            `
          }}
        />
        <QueryProvider>
          <div className="px-3 py-3 sm:px-4 lg:px-6">
            <div className="shell-frame mx-auto grid min-h-[calc(100vh-24px)] max-w-[1660px] gap-5 rounded-[34px] p-3 sm:p-4 lg:grid-cols-[292px_1fr] lg:p-5">
              <Sidebar />
              <main className="space-y-5 rounded-[28px] border border-black/5 bg-[rgba(255,255,255,0.68)] px-3 py-3 sm:px-4 sm:py-4 dark:border-white/8 dark:bg-[rgba(6,10,18,0.72)] lg:px-5 lg:py-5">
                {children}
              </main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
