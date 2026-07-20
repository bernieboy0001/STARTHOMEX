"use client";

import Link from "next/link";
import { Activity, BellRing, FileText, HeartPulse, LogOut, Menu, Video, WandSparkles, X } from "lucide-react";
import { useState } from "react";

const menuLinks = [
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/reminders", label: "Alerts", icon: BellRing },
  { href: "/dashboard/notes", label: "Notes", icon: HeartPulse },
  { href: "/dashboard/ai", label: "Extract", icon: WandSparkles },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/videos", label: "Videos", icon: Video }
];

export function MobileDashboardMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-menu">
      <button className="mobile-menu-button" type="button" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(value => !value)}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="mobile-menu-panel">
          {menuLinks.map(item => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <a href="/sign-out" onClick={() => setOpen(false)}>
            <LogOut size={18} />
            <span>Sign out</span>
          </a>
        </div>
      )}
    </div>
  );
}
