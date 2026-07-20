import { Avatar, AvatarFallback, AvatarImage } from '@/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import { NotificationBar } from '@/custom/notification-bar';
import { type AuthUser, useAuth } from '@/hooks/use-auth';
import {
  getAvatarUrlFromAuthUser,
  getInitialsFromDisplayName,
  resolveAuthDisplayName,
  resolveAuthEmail,
} from '@/lib/avatar';
import { LogOut, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

export const AuthLayout = () => {
  const { check, logout } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    check()
      .then((response) => {
        if (!cancelled) {
          setUser(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [check]);

  const displayName = resolveAuthDisplayName(user);
  const email = resolveAuthEmail(user);
  const avatarUrl = getAvatarUrlFromAuthUser(user);
  const initials = getInitialsFromDisplayName(displayName, 'U');

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="bg-background/90 supports-backdrop-filter:bg-background/75 border-border sticky top-0 z-40 flex w-screen items-center justify-between border-b px-3 py-2 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3 ps-2 sm:ps-4">
        <span className="ring-primary/10 relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2">
          <a href="">
            <img
              className="aspect-square h-full w-full"
              alt="Adamson Logo"
              src="/assets/images/adulogo.png"
            />
          </a>
        </span>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight">AdU Live</h1>
        </div>
      </div>
      <div className="me-2 flex items-center gap-3 sm:me-4">
        <NotificationBar />
        <DropdownMenu>
          <DropdownMenuTrigger className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
            <Avatar className="ring-border ring-1">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mx-2 w-[min(350px,calc(100vw-1rem))] rounded-2xl border shadow-xl">
            <div className="p-4 text-center">
              <div className="mb-2 flex justify-center">
                <Avatar>
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{displayName}</p>
                {email ? <p className="text-xs">{email}</p> : null}
              </div>
              <div className="mt-4">
                <a
                  href="/legacy/myaccount"
                  className="border-border hover:bg-muted inline-flex rounded-full border px-4 py-1.5 text-sm transition-colors"
                >
                  Manage your account
                </a>
              </div>
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <div className="grid grid-cols-3 gap-1">
                {/* {quick_access_systems.map((system, i) => (
          <React.Fragment key={i}>
            {permission.checkPermission(system.permissions) && (
              <QuickAccessTile
                icon={system.icon}
                label={system.name}
                url={system.route}
              />
            )}
          </React.Fragment>
        ))} */}
              </div>
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <DropdownMenuItem
                asChild
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl py-2 text-sm"
              >
                <a href="/legacy/myaccount">
                  <Settings size={18} />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <DropdownMenuItem
                disabled={loggingOut}
                onClick={handleLogout}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl py-2"
              >
                <LogOut size={18} />
                <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
