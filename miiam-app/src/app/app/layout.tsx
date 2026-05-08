import BottomNavBar from "@/components/layout/BottomNavBar";
import Toaster from "@/components/ui/Toaster";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#fff4f4] min-h-screen">
      {children}
      <BottomNavBar />
      <Toaster />
    </div>
  );
}
