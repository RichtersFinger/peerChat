import { Avatar } from "flowbite-react";

import useUser from "../hooks/useUser";
import { Conversation } from "../hooks/useConversation";

export type ChatHeaderProps = {
  conversation: Conversation;
};

export default function ChatHeader({ conversation }: ChatHeaderProps) {
  const user = useUser(conversation.peer);

  return (
    <div className="flex flex-row space-x-2 bg-slate-50 p-2">
      <Avatar
        {...(user.avatar ? { img: user.avatar } : {})}
        rounded
        size="lg"
      />
      <div className="flex-col space-y-1 font-medium">
        <p className="truncate">{conversation.name ?? conversation.id}</p>
        {user.name ? (
          <p className="truncate text-sm text-gray-500">{user.name}</p>
        ) : null}
        {conversation.peer ? (
          <p className="truncate text-sm text-gray-500">{conversation.peer}</p>
        ) : null}
      </div>
    </div>
  );
}
