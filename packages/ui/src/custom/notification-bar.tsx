import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import { Skeleton } from '@/components/skeleton';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { MdOutlineNotifications } from 'react-icons/md';

export const NotificationBar = () => {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="relative cursor-pointer">
            <MdOutlineNotifications className="text-white h-6 w-6" />
            {/* {notificationCount > 0 && (
              <span className="text-xs text-white absolute bg-red-500 -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full">
                {notificationCount}
              </span>
            )} */}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="text-white w-[380px] backdrop-blur-md bg-black/30 border-b border-white/20"
        >
          <div className="flex items-center justify-between p-2">
            <DropdownMenuLabel className="text-lg font-semibold">
              Notifications
            </DropdownMenuLabel>
            {/* {notificationCount > 0 && (
              <Button
                type="button"
                onClick={() => {
                  setAction({
                    action: 'mark-all-as-read',
                    id: null,
                  });
                  markAsRead(null);
                  notificationStore.readAll();
                }}
                variant="ghost"
                className="h-auto text-xs py-1"
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all as read
              </Button>
            )} */}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto transition-all">
            {/* {notificationStore.notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notificationStore.notifications.map(
                (notification: NotificationInterface, i) => {
                  const data: ParsedDataNotification = notification.new
                    ? JSON.parse(notification.data)
                    : notification.data;
                  return (
                    <div
                      ref={
                        notificationStore.notifications.length === i + 1
                          ? lastPostElement
                          : null
                      }
                      onClick={() => {
                        setAction({
                          action: 'mark-as-read',
                          id: notification.new ? data.id : notification.id,
                        });
                        markAsRead(data);
                        notificationStore.updateNotification(notification.id, {
                          ...notification,
                          read_at: moment().format('YYYY-MM-DD'),
                          new: false,
                          data: data,
                        });
                      }}
                      key={i}
                      className={cn(
                        'flex items-start p-4 hover:bg-white/20 rounded-lg cursor-pointer transition',
                        !notification.read_at && '',
                        notification.new ? 'bg-red-200 hover:bg-red-100' : '',
                      )}
                    >
                      <Notification notification={notification} data={data} />
                    </div>
                  );
                },
              )
            )}
            {getNotification.isFetching && (
              <Skeleton className="p-4">
                <p className="text-sm italic text-center">
                  Loading notifications...
                </p>
              </Skeleton>
            )} */}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
