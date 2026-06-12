import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";
import Toaster from "@/components/ui/Toaster";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { AnalyticsTracker } from "@/lib/analytics";
import SplashScreen from "@/components/SplashScreen";
import OfflineBanner from "@/components/OfflineBanner";
import { SkipLink } from "@/lib/accessibility";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "MIIAM — Food & Services App",
  description:
    "Order food, book home services - all in one app.",
  keywords: ["food delivery", "home services", "super app", "MIIAM"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MIIAM",
  },
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 3,
  viewportFit: "cover",
  themeColor: "#ba001c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={jakartaSans.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, viewport-fit=cover" />
        <meta name="theme-color" content="#ba001c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem("miiam-theme");
              var s = t ? JSON.parse(t).state?.theme : "light";
              if (s === "dark" || (s === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                document.documentElement.classList.add("dark");
              }
              var l = localStorage.getItem("miiam-language");
              var lang = l ? JSON.parse(l).state?.language : "en";
              document.documentElement.lang = lang;
            } catch(e) { document.documentElement.lang = "en"; }
          `
        }} />
        <link rel="preconnect" href="https://ui-avatars.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>JavaScript Required</h1>
            <p>MIIAM requires JavaScript to function. Please enable JavaScript in your browser settings.</p>
          </div>
        </noscript>
        <OfflineBanner />
        <ThemeProvider>
          <ConfirmProvider>
            <SplashScreen />
            <ServiceWorkerRegistration />
            <AnalyticsTracker />
            <ErrorBoundary>
              <div id="main-content">
                <PageTransition>{children}</PageTransition>
              </div>
            </ErrorBoundary>
            <Toaster />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
