"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { UserRound, Heart, MessageSquare, LogOut, Settings } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  const signOut = async () => {
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          {initial}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-50 min-w-[200px] rounded-md border border-border bg-surface p-1 shadow-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="px-2.5 py-2 border-b border-border mb-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Signed in as</div>
            <div className="text-xs text-text truncate mt-0.5">{email}</div>
          </div>
          <MenuItem href="/profile" icon={<UserRound className="h-3.5 w-3.5" />}>
            Profile
          </MenuItem>
          <MenuItem href="/profile/favourites" icon={<Heart className="h-3.5 w-3.5" />}>
            Favourites
          </MenuItem>
          <MenuItem href="/profile/reviews" icon={<MessageSquare className="h-3.5 w-3.5" />}>
            My reviews
          </MenuItem>
          <MenuItem href="/profile" icon={<Settings className="h-3.5 w-3.5" />}>
            Preferences
          </MenuItem>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => signOut()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs text-text outline-none focus:bg-surface-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs text-text outline-none focus:bg-surface-2"
      >
        {icon}
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
