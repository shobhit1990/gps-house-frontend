import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { LayoutProps } from "@/interfaces/ui";
import { ENV } from "@/config/env";

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { logout } = useAuth();
  const currentUser = useSelector(selectCurrentUser);
  const { isMobile, isTablet } = useMobile();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  useEffect(() => {
    if (isMobile || isTablet) {
      setCollapsed(true);
      setShowMobileSidebar(false);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && showMobileSidebar) {
        const sidebar = document.getElementById("mobile-sidebar");
        const hamburger = document.getElementById("mobile-hamburger");
        if (
          sidebar &&
          !sidebar.contains(event.target as Node) &&
          hamburger &&
          !hamburger.contains(event.target as Node)
        ) {
          setShowMobileSidebar(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, showMobileSidebar]);

  const userRole = currentUser?.roleName || currentUser?.role || "User";

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Desktop header */}
      <div
        className="fixed right-0 top-0 z-30 hidden border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-300 lg:block"
        style={{ left: collapsed ? "4rem" : "16rem" }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <User className="h-3 w-3 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">
                {currentUser?.name || currentUser?.username}
              </h2>
              <p className="text-xs text-slate-500">{userRole}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between p-4">
          <span className="text-lg font-bold text-primary">{ENV.APP_NAME}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-200 p-2 text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              id="mobile-hamburger"
              variant="outline"
              size="sm"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="p-2"
            >
              {showMobileSidebar ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div id="mobile-sidebar" className={`lg:block ${showMobileSidebar ? "block" : "hidden"}`}>
        <Sidebar onLogout={handleLogout} />
      </div>

      {showMobileSidebar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
          aria-hidden="true"
        />
      )}

      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${
          isMobile ? "ml-0 pt-20" : "pt-16"
        }`}
        style={{ marginLeft: isMobile ? "0" : collapsed ? "4rem" : "16rem" }}
      >
        <div className="max-w-full p-2 sm:p-3 lg:p-4">{children}</div>
      </main>
    </div>
  );
}
