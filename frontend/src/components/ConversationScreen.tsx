import { Avatar } from "flowbite-react";

import { Conversation } from "./ConversationLoader";

export type ConversationScreenProps = {
  conversation: Conversation;
};

export default function ConversationScreen({
  conversation,
}: ConversationScreenProps) {
  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden">
      {
        // header
      }
      <div className="flex flex-row space-x-2 bg-slate-50 p-2">
        <Avatar
          {...(conversation.avatar ? { img: conversation.avatar } : {})}
          rounded
          size="lg"
        />
        <div className="flex-col space-y-1 font-medium">
          <p className="truncate">{conversation.name ?? conversation.id}</p>
          {conversation.peerName ? (
            <p className="truncate text-sm text-gray-500">
              {conversation.peerName}
            </p>
          ) : null}
          {conversation.peer ? (
            <p className="truncate text-sm text-gray-500">
              {conversation.peer}
            </p>
          ) : null}
        </div>
      </div>
      {
        // body
      }
      <p>{JSON.stringify(conversation)}</p>
    </div>
  );
}
