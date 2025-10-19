import { useState } from "react";
import { User, Settings, LogOut, Globe, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/profile/LanguageSelector";

interface UserMenuProps {
  onNavigate: (path: string) => void;
}

export function UserMenu({ onNavigate }: UserMenuProps) {
  const { t } = useTranslation('common');
  const { profile, logout } = useAppStore();
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavigation = (path: string) => {
    setOpen(false);
    onNavigate(path);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full"
          aria-label={t('userMenu.menu')}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'Usuario'} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(profile?.full_name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-background" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || t('userMenu.user')}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile?.email || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleNavigation('/perfil')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>{t('userMenu.viewProfile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleNavigation('/ajustes')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('userMenu.settings')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t('userMenu.language')}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <div className="px-2 py-1">
          <LanguageSelector />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => {
            setOpen(false);
            logout();
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('userMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
