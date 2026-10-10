import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceSettingsSync from "@/components/ServiceSettingsSync";
import ThemeProvider from "@/components/ThemeProvider";
import PageTransition from "@/components/PageTransition";
import OnboardingGate from "@/components/OnboardingGate";
import SwipeBackProvider from "@/components/SwipeBackProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <OnboardingGate>
        <SwipeBackProvider>
          <div className="bg-surface text-on-surface min-h-screen transition-colors">
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <NotificationPermission />
            <InstallPrompt />
            <ServiceSettingsSync />
            <div className="mx-auto max-w-7xl">
              <PageTransition>
                <main id="main-content">{children}</main>
              </PageTransition>
            </div>
            <BottomNavBar />
          </div>
        </SwipeBackProvider>
      </OnboardingGate>
    </ThemeProvider>
  );
}
