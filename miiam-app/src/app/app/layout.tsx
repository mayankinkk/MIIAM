import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceSettingsSync from "@/components/ServiceSettingsSync";
import ThemeProvider from "@/components/ThemeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface dark:bg-gray-950 text-on-surface dark:text-gray-100 transition-colors">
        <NotificationPermission />
        <InstallPrompt />
        <ServiceSettingsSync />
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
        <BottomNavBar />
      </div>
    </ThemeProvider>
  );
}
