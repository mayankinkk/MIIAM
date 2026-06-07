import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineBanner from "@/components/OfflineBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <OfflineBanner />
      <NotificationPermission />
      <InstallPrompt />
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
      <BottomNavBar />
    </div>
  );
}
