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
          <div className="bg-surface-container text-on-surface min-h-screen transition-colors">
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <NotificationPermission />
            <InstallPrompt />
            <ServiceSettingsSync />
            {/* Phone-width column on desktop so mobile-first tiles/nav don't stretch */}
            <div className="bg-surface mx-auto min-h-screen w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.06)]">
              <PageTransition>
                <main id="main-content" className="pb-20">
                  {children}
                </main>
              </PageTransition>
              <BottomNavBar />
            </div>
          </div>
        </SwipeBackProvider>
      </OnboardingGate>
    </ThemeProvider>
  );
}
