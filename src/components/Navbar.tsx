"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, ClipboardList, User } from "lucide-react";

const ICON_SIZE = 22;

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <Home size={ICON_SIZE} strokeWidth={active ? 2.2 : 1.6} />
    ),
  },
  {
    href: "/meal-plan",
    label: "Meal Plan",
    icon: (active: boolean) => (
      <CalendarDays size={ICON_SIZE} strokeWidth={active ? 2.2 : 1.6} />
    ),
  },
  {
    href: "/shopping-list",
    label: "Shop",
    icon: (active: boolean) => (
      <ClipboardList size={ICON_SIZE} strokeWidth={active ? 2.2 : 1.6} />
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <User size={ICON_SIZE} strokeWidth={active ? 2.2 : 1.6} />
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl nav-shadow safe-x">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 transition-colors duration-200 active:scale-95 ${
                isActive ? "text-primary" : "text-muted"
              }`}
            >
              {tab.icon(isActive)}
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -top-1 h-[3px] w-5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
