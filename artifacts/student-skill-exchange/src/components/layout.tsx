import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Search,
  Users,
  MessageSquare,
  User,
  LogOut,
  Menu,
  GraduationCap,
  Sparkles
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Discover", href: "/discover", icon: Search },
    { label: "Matches", href: "/matches", icon: Sparkles },
    { label: "Connections", href: "/connections", icon: Users },
    { label: "Chat", href: "/chat", icon: MessageSquare },
  ];

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r w-64 p-4">
      <div className="flex items-center gap-2 px-2 mb-8 text-primary">
        <GraduationCap className="h-8 w-8" />
        <span className="font-bold text-xl tracking-tight">SkillX</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t space-y-1">
        <Link href="/profile" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === "/profile" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
          <User className="h-5 w-5" />
          <span>My Profile</span>
        </Link>
        <button onClick={() => logout()} className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="h-6 w-6" />
            <span className="font-bold text-lg">SkillX</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}