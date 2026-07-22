import Link from "next/link";
import { LogOut } from "lucide-react";
import { MobileDashboardMenu } from "@/components/mobile-dashboard-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardNavigation } from "@/components/dashboard-navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="app-rail">
        <Link href="/" className="brand">
          <img className="brand-logo" src="/homex-logo.png" alt="HOMEX" />
          <span><strong>HOMEX</strong><span>Care at home</span></span>
        </Link>
        <ThemeToggle />
        <DashboardNavigation />
        <a href="/sign-out" className="app-sign-out">
          <LogOut size={18} />
          <span>Sign out</span>
        </a>
      </aside>
      <div className="app-view">
        <header className="mobile-app-bar">
          <Link href="/dashboard" className="brand">
            <img className="brand-logo" src="/homex-logo.png" alt="HOMEX" />
            <span><strong>HOMEX</strong><span>Care at home</span></span>
          </Link>
          <ThemeToggle />
          <MobileDashboardMenu />
        </header>
        {children}
        <DashboardNavigation mobile />
      </div>
    </div>
  );
}
