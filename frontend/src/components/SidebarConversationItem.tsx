import { Sidebar as FBSidebar, Avatar } from "flowbite-react";

import { Conversation } from "../stores";
import useUser from "../hooks/useUser";

export type SidebarConversationItemProps = {
  conversation: Conversation;
  showIndicator?: boolean;
  onClick?: (c: Conversation) => void;
};

export default function SidebarConversationItem({
  conversation,
  showIndicator = true,
  onClick,
}: SidebarConversationItemProps) {
  const user = useUser(conversation?.peer);

  return (
    <FBSidebar.Item
      theme={{
        base: "flex items-start	justify-start rounded-lg py-2 text-base font-normal text-gray-900 hover:bg-gray-100",
      }}
      onClick={() => {
        if (onClick) onClick(conversation);
      }}
    >
      <div className="relative flex flex-row space-x-2">
        <Avatar
          {...(user.avatar ? { img: user.avatar } : {})}
          rounded
          size="md"
        />
        <div className="flex-col space-y-1 font-medium">
          <p className="max-w-48 truncate">
            {conversation.name ?? conversation.id}
          </p>
          <p className="max-w-48 truncate text-sm text-gray-500">
            {user.name ?? conversation.peer ?? "-"}
          </p>
        </div>
        {showIndicator && conversation.unreadMessages ? (
          <div className="absolute bg-red-500 w-2.5 aspect-square rounded-full top-5 -left-5"></div>
        ) : null}
      </div>
    </FBSidebar.Item>
  );
}
