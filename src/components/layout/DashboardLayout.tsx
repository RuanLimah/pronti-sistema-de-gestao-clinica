import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      
      <div className={`transition-all duration-300 ${isMobile ? 'pl-0' : 'pl-64'}`}>
        <Header 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setMobileMenuOpen(true)}
          showMenuButton={isMobile}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
