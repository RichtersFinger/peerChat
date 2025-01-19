import { Avatar, Dropdown } from "flowbite-react";
import { FiMoreVertical } from "react-icons/fi";

import useUser from "../hooks/useUser";

export type DropdownItemType = {
  label: string;
  onClick?: () => void;
};

export type SidebarUserItemProps = {
  connected: boolean;
  url?: string;
  menuItems?: DropdownItemType[];
};

export default function SidebarUserItem({
  connected,
  url,
  menuItems,
}: SidebarUserItemProps) {
  const user = useUser(connected ? url : undefined);

  return (
    <div className="relative h-full">
      <div className="absolute left-0 top-0 flex flex-row space-x-2 px-1">
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
      {menuItems && menuItems.length > 0 ? (
        <div className="absolute right-1 top-0 ">
          <Dropdown
            label=""
            dismissOnClick={true}
            renderTrigger={() => (
              <div>
                <FiMoreVertical className="rounded-lg px-0.5 h-8 w-5 transition ease-in-out bg-gray-200 hover:bg-gray-100" />
              </div>
            )}
          >
            {menuItems.map((item: DropdownItemType) => (
              <Dropdown.Item onClick={item.onClick}>{item.label}</Dropdown.Item>
            ))}
          </Dropdown>
        </div>
      ) : null}
    </div>
  );
}
