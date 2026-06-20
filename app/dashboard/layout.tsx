import Link from "next/link";
import { Activity, BellRing, CalendarDays, ClipboardList, FileText, HeartPulse, Home, LogOut, Pill, UsersRound, Video, WandSparkles } from "lucide-react";
import { MobileDashboardMenu } from "@/components/mobile-dashboard-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const primaryLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/dashboard/medications", label: "Meds", icon: Pill },
  { href: "/dashboard/visits", label: "Visits", icon: CalendarDays },
  { href: "/dashboard/family", label: "Family", icon: UsersRound }
];

const secondaryLinks = [
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
  { href: "/dashboard/reminders", label: "Alerts", icon: BellRing },
  { href: "/dashboard/notes", label: "Notes", icon: HeartPulse },
  { href: "/dashboard/ai", label: "Extract", icon: WandSparkles },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/videos", label: "Videos", icon: Video }
];

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
        <nav className="app-nav">
          {[...primaryLinks, ...secondaryLinks].map(item => {
            const Icon = item.icon;
            return <Link href={item.href} key={item.href}><Icon size={18} /><span>{item.label}</span></Link>;
          })}
        </nav>
        <Link href="/sign-out" className="app-sign-out">
          <LogOut size={18} />
          <span>Sign out</span>
        </Link>
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
        <nav className="mobile-tabs">
          {primaryLinks.map(item => {
            const Icon = item.icon;
            return <Link href={item.href} key={item.href}><Icon size={19} /><span>{item.label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
