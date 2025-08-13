import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
  onSearch?: (query: string) => void;
}

export default function Header({ title, subtitle, onSearch }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-secondary">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {onSearch && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search articles..."
                className="w-80 pl-10"
                onChange={(e) => onSearch(e.target.value)}
                data-testid="input-search"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            </div>
          )}
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
