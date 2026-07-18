import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceSettingsSync from "@/components/ServiceSettingsSync";
import ThemeProvider from "@/components/ThemeProvider";
import PageTransition from "@/components/PageTransition";
import OnboardingGate from "@/components/OnboardingGate";
import BackToTop from "@/components/BackToTop";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <OnboardingGate>
        <div className="min-h-screen bg-surface dark:bg-gray-950 text-on-surface dark:text-gray-100 transition-colors">
          <NotificationPermission />
          <InstallPrompt />
          <ServiceSettingsSync />
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
          <BottomNavBar />
          <BackToTop />
        </div>
      </OnboardingGate>
    </ThemeProvider>
  );
}
