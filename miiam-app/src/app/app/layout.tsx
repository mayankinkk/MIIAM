import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";
import InstallPrompt from "@/components/InstallPrompt";
import ThemeProvider from "@/components/ThemeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <ThemeProvider />
      <NotificationPermission />
      <InstallPrompt />
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
      <BottomNavBar />
    </div>
  );
}
