import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Newspaper, 
  BarChart3, 
  Upload, 
  Bookmark, 
  Search, 
  Wind,
  User
} from "lucide-react";

const navigationItems = [
  { path: "/", icon: Newspaper, label: "News Feed", testId: "nav-news" },
  { path: "/analytics", icon: BarChart3, label: "Analytics", testId: "nav-analytics" },
  { path: "/documents", icon: Upload, label: "Document Analysis", testId: "nav-documents" },
  { path: "/bookmarks", icon: Bookmark, label: "Bookmarks", testId: "nav-bookmarks" },
  { path: "/search", icon: Search, label: "Search", testId: "nav-search" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Wind className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">HVAC Intel</h1>
            <p className="text-sm text-secondary">Industry Intelligence</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={item.testId}
            >
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-blue-50 text-primary dark:bg-blue-950" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">John Smith</p>
            <p className="text-xs text-secondary">Industry Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
