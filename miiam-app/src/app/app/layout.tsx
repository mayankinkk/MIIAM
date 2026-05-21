import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";
import InstallPrompt from "@/components/InstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#fff4f4] min-h-screen">
      <NotificationPermission />
      <InstallPrompt />
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
      <BottomNavBar />
    </div>
  );
}
