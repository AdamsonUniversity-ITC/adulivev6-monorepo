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
  <div className="sticky w-screen bg-white top-0 flex items-center justify-between p-2 border-b border-gray/20">
    <div className="flex items-center gap-2 ps-4">
      <span className="relative flex shrink-0 overflow-hidden rounded-full h-9 w-9 cursor-pointer">
        <a href="">
          <img
            className="aspect-square h-full w-full"
            alt="Adamson Logo"
            src="/assets/images/adulogo.png"
          />
        </a>
      </span>
      <h1 className="">AdU Live</h1>
    </div>
    <div className="flex gap-6 items-center me-4">
      <NotificationBar />
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage src={`https://placehold.co/200`} alt="User image" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mx-2 w-[350px]rounded-2xl border border-white/20">
          <div className="p-4 text-center">
            <div className="flex justify-center mb-2">
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
                className="border border-white hover:bg-black/20! text-sm rounded-full px-4 py-1 transition-colors"
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
            <DropdownMenuItem className="border border-transparent hover:border-white/20 hover:bg-black/20! text-sm flex items-center gap-2 py-2 cursor-pointer">
              <Settings size={18} />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="border border-transparent hover:border-white/20 hover:bg-black/20! text-sm flex items-center gap-2 py-2 cursor-pointer">
              <HelpCircle size={18} />
              <span>Help & Support</span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          <div className="p-2">
            <DropdownMenuItem className="border border-transparent hover:border-white/20 hover:bg-black/20! flex items-center gap-2 py-2 cursor-pointer">
              <LogOut size={18} />
              <span>Logout</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);
