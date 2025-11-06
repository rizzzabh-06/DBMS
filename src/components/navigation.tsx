"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Database, Home, Search, Settings, FileCode, Zap, ScrollText, LogOut, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/manage", label: "Manage Data", icon: Database },
    { href: "/queries", label: "Queries", icon: Search },
    { href: "/procedures", label: "Procedures", icon: Settings },
    { href: "/triggers", label: "Triggers", icon: Zap },
    { href: "/logs", label: "SQL Logs", icon: ScrollText },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    const token = localStorage.getItem("bearer_token");

    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (error?.code) {
      toast.error("Failed to sign out");
      setSigningOut(false);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success("Signed out successfully");
      setSigningOut(false);
      router.push("/");
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Cricket SQL Manager</span>
          </div>
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            
            {!isPending && (
              <div className="ml-4 flex items-center gap-2">
                {session?.user ? (
                  <>
                    <span className="text-sm text-muted-foreground px-2">
                      {session.user.name}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" size="sm">
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}