import BottomNavBar from "@/components/layout/BottomNavBar";
import NotificationPermission from "@/components/NotificationPermission";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#fff4f4] min-h-screen">
      <NotificationPermission />
      {children}
      <BottomNavBar />
    </div>
  );
}
