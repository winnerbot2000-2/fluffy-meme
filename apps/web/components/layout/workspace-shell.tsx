"use client";

import { seededSearch } from "@apmicro/content-core";
import { AppSidebar, SearchCommand } from "@apmicro/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

import { sidebarItems } from "@/lib/navigation";
import { SelectionAssistant } from "@/components/sources/selection-assistant";
import { useAppStore } from "@/lib/stores/app-store";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchOpen = useAppStore((state) => state.searchOpen);
  const setSearchOpen = useAppStore((state) => state.setSearchOpen);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) {
        return;
      }

      event.preventDefault();
      setSearchOpen(!searchOpen);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [searchOpen, setSearchOpen]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_58%)]" />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1600px] gap-6 p-4 md:p-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <AppSidebar items={sidebarItems} activeHref={pathname ?? "/"} />
        </aside>
        <main className="min-w-0 pb-10">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 xl:hidden">
            {sidebarItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
                    active
                      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                      : "border-white/10 bg-white/6 text-zinc-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {children}
        </main>
      </div>

      <SearchCommand results={seededSearch} open={searchOpen} onOpenChange={setSearchOpen} />
      <SelectionAssistant />
    </>
  );
}
