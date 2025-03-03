import { useShallow } from "zustand/react/shallow";
import { Avatar } from "flowbite-react";

import useStore, { Conversation } from "../stores";

export type ChatHeaderProps = {
  conversation: Conversation;
};

export default function ChatHeader({ conversation }: ChatHeaderProps) {
  const peer = useStore(
    useShallow((state) => state.peers.data[conversation.peer ?? ""])
  );

  return (
    <div className="flex flex-row space-x-2 bg-slate-50 p-2">
      <Avatar
        theme={{ root: { img: { base: "rounded object-cover" } } }}
        {...{ img: peer?.avatar }}
        rounded
        size="lg"
      />
      <div className="flex-col space-y-1 font-medium">
        <p className="truncate">{conversation.name ?? conversation.id}</p>
        {peer?.name ? (
          <p className="truncate text-sm text-gray-500">{peer?.name}</p>
        ) : null}
        {conversation.peer ? (
          <p className="truncate text-sm text-gray-500">{conversation.peer}</p>
        ) : null}
      </div>
    </div>
  );
}
