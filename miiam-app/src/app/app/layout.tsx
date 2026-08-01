import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceSettingsSync from "@/components/ServiceSettingsSync";
import ThemeProvider from "@/components/ThemeProvider";
import PageTransition from "@/components/PageTransition";
import OnboardingGate from "@/components/OnboardingGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <OnboardingGate>
        <div className="min-h-screen bg-surface text-on-surface transition-colors">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <NotificationPermission />
          <InstallPrompt />
          <ServiceSettingsSync />
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              <main id="main-content">
                {children}
              </main>
            </PageTransition>
          </div>
          <BottomNavBar />
        </div>
      </OnboardingGate>
    </ThemeProvider>
  );
}
