import { Avatar, AvatarFallback, AvatarImage } from '@/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import { NotificationBar } from '@/custom/notification-bar';
import { HelpCircle, LogOut, Settings } from 'lucide-react';

export const AuthLayout = () => (
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
            <AvatarImage src={`https://placehold.co/200`} alt="User image" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mx-2 w-[min(350px,calc(100vw-1rem))] rounded-2xl border shadow-xl">
          <div className="p-4 text-center">
            <div className="mb-2 flex justify-center">
              <Avatar>
                <AvatarImage />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {/* {user_info?.user_info?.fname} {user_info?.user_info?.lname} */}
              </p>
              {/* <p className="text-xs">{user_info?.user_info?.emailadd}</p> */}
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
            <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl py-2 text-sm">
              <Settings size={18} />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl py-2 text-sm">
              <HelpCircle size={18} />
              <span>Help & Support</span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          <div className="p-2">
            <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl py-2">
              <LogOut size={18} />
              <span>Logout</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);
