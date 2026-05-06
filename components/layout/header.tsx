'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, User, LogOut } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { useUIStore } from '../../lib/stores/ui-store';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Map pathnames to page titles
const getPageTitle = (pathname: string | null): string => {
  if (!pathname) return 'Vigens';

  if (pathname === '/dashboard' || pathname === '/') return 'Tableau de bord';
  if (pathname.startsWith('/projects')) return 'Projets';

  return 'Vigens';
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };

    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side: Hamburger + Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={toggleSidebar}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
        </div>

        {/* Right side: User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Menu utilisateur"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Compte</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail || 'Chargement...'}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoading ? 'Déconnexion...' : 'Déconnexion'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
