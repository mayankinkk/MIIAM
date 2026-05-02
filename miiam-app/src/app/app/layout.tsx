import BottomNavBar from "@/components/layout/BottomNavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#fff4f4] min-h-screen">
      {children}
      <BottomNavBar />
    </div>
  );
}
