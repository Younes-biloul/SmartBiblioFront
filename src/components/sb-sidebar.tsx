import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  BookOpen, LayoutDashboard, Users, BookCopy, UserCircle2,
  Library, Bookmark, Tags, Bell, Settings, LogOut, ScanLine,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth, type Role } from "@/lib/smartbiblio/auth";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type Item = { titleKey: string; url: string; icon: typeof BookOpen; roles?: Role[] };

const mainItems: Item[] = [
  { titleKey: "sidebar.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "sidebar.catalog", url: "/books", icon: Library },
  { titleKey: "sidebar.loans", url: "/loans", icon: BookOpen },
  { titleKey: "sidebar.scan", url: "/scan", icon: ScanLine, roles: ["librarian", "admin"] },
  { titleKey: "sidebar.notifications", url: "/notifications", icon: Bell },
  { titleKey: "sidebar.myProfile", url: "/profile", icon: UserCircle2 },
];

const manageItems: Item[] = [
  { titleKey: "sidebar.members", url: "/members", icon: Users, roles: ["librarian", "admin"] },
  { titleKey: "sidebar.authors", url: "/authors", icon: Bookmark, roles: ["librarian", "admin"] },
  { titleKey: "sidebar.genres", url: "/genres", icon: Tags, roles: ["librarian", "admin"] },
  { titleKey: "sidebar.bookCopies", url: "/book-copies", icon: BookCopy, roles: ["librarian", "admin"] },
];

export function SbSidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (p: string) => pathname === p || pathname.startsWith(p + "/");

  const renderItem = (item: Item) =>
    item.roles && !hasRole(...item.roles) ? null : (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            <span>{t(item.titleKey)}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Library className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight">{t("common.appName")}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("common.appTagline")}</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.groupMain")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasRole("librarian", "admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.groupManage")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{manageItems.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.groupSystem")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")}>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t("sidebar.settings")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-medium">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
              {user?.role}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
            title={t("common.signOut")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}