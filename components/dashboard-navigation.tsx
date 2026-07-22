"use client";

import Link from "next/link";
import { Activity, BellRing, CalendarDays, ClipboardList, FileText, HeartPulse, Home, Pill, UsersRound, Video, WandSparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const primaryLinks = [
  { href: "/dashboard", label: "Overview", shortLabel: "Home", icon: Home },
  { href: "/dashboard/tasks", label: "Tasks", shortLabel: "Tasks", icon: ClipboardList },
  { href: "/dashboard/medications", label: "Medications", shortLabel: "Meds", icon: Pill },
  { href: "/dashboard/visits", label: "Appointments", shortLabel: "Visits", icon: CalendarDays },
  { href: "/dashboard/family", label: "Care circle", shortLabel: "Circle", icon: UsersRound }
];

const supportingLinks = [
  { href: "/dashboard/notes", label: "Care notes", icon: HeartPulse },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/reminders", label: "Reminders", icon: BellRing },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/videos", label: "Videos", icon: Video },
  { href: "/dashboard/ai", label: "Extract", icon: WandSparkles }
];

function selected(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function DashboardNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const links = mobile ? primaryLinks : [...primaryLinks, ...supportingLinks];

  return (
    <nav className={mobile ? "mobile-tabs" : "app-nav"} aria-label="Care workspace">
      {!mobile && <p className="nav-section-label">Care essentials</p>}
      {links.map((item, index) => {
        const Icon = item.icon;
        const isSupporting = index === primaryLinks.length;
        return (
          <span key={item.href} className={isSupporting ? "nav-supporting-start" : undefined}>
            {isSupporting && <span className="nav-section-label nav-section-spaced">Supporting tools</span>}
            <Link href={item.href} aria-current={selected(pathname, item.href) ? "page" : undefined}>
              <Icon size={mobile ? 19 : 18} /><span>{mobile ? (item as typeof primaryLinks[number]).shortLabel : item.label}</span>
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
