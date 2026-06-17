import Link from "next/link";
import { Activity, BellRing, Building2, CalendarDays, ClipboardList, FileText, HeartPulse, Home, Layers, Pill, Smartphone, UsersRound, Video, WandSparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const primaryLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/circles", label: "Circles", icon: Layers },
  { href: "/dashboard/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/dashboard/medications", label: "Meds", icon: Pill },
  { href: "/dashboard/visits", label: "Visits", icon: CalendarDays }
];

const secondaryLinks = [
  { href: "/dashboard/family", label: "Family", icon: UsersRound },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
  { href: "/dashboard/reminders", label: "Alerts", icon: BellRing },
  { href: "/dashboard/notes", label: "Notes", icon: HeartPulse },
  { href: "/dashboard/ai", label: "Extract", icon: WandSparkles },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/videos", label: "Videos", icon: Video },
  { href: "/agency", label: "Agency", icon: Building2 },
  { href: "/dashboard/app", label: "Install", icon: Smartphone }
];

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      </aside>
      <div className="app-view">
        <header className="mobile-app-bar">
          <Link href="/dashboard" className="brand">
            <img className="brand-logo" src="/homex-logo.png" alt="HOMEX" />
            <span><strong>HOMEX</strong><span>Care at home</span></span>
          </Link>
          <ThemeToggle />
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
