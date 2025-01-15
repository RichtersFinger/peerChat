import { Avatar } from "flowbite-react";

import useUser from "../hooks/useUser";

export type SidebarUserItemProps = {
  connected: boolean;
  url?: string;
};

export default function SidebarUserItem({
  connected,
  url,
}: SidebarUserItemProps) {
  const user = useUser(connected ? url : undefined);

  return (
    <div className="flex flex-row space-x-2 px-1">
      <Avatar
        {...(user?.avatar ? { img: user.avatar } : {})}
        rounded
        statusPosition="bottom-left"
        status={connected ? "online" : "offline"}
      ></Avatar>
      <div className="flex-col space-y-1 font-medium">
        <p className="max-w-48 truncate font-bold">
          {user?.name ? user.name : "-"}
        </p>
        <p className="max-w-48 truncate text-sm text-gray-500">{url}</p>
      </div>
    </div>
  );
}
