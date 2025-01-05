import { Sidebar as FBSidebar, Avatar } from "flowbite-react";

import { Conversation } from "./ConversationLoader";

export type ConversationItemProps = {
  conversation: Conversation;
};

export default function ConversationItem({
  conversation,
}: ConversationItemProps) {
  return (
    <FBSidebar.Item
      theme={{
        base: "flex items-start	justify-start rounded-lg py-2 text-base font-normal text-gray-900 hover:bg-gray-100",
      }}
    >
      <div className="relative flex flex-row space-x-2">
        <Avatar
          {...(conversation.avatar ? { img: conversation.avatar } : {})}
          rounded
          size="md"
        ></Avatar>
        <div className="flex-col space-y-1 font-medium">
          <p className="max-w-36 truncate">{conversation.name ?? conversation.id}</p>
          <p className="max-w-36 truncate text-sm text-gray-500">
            {conversation.peerName ?? conversation.peer ?? "-"}
          </p>
        </div>
        {
          // new-message indicator
          //<div className="absolute bg-orange-300 w-2.5 aspect-square rounded-full top-5 -left-5"></div>
        }
      </div>
    </FBSidebar.Item>
  );
}
