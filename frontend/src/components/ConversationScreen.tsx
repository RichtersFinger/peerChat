import { useEffect, useReducer } from "react";
import { Avatar } from "flowbite-react";
import { Socket } from "socket.io-client";

import { Conversation } from "./ConversationLoader";
import MessageLoader, { Message } from "./MessageLoader";

export type ConversationScreenProps = {
  socket: Socket;
  conversation: Conversation;
};

export default function ConversationScreen({
  socket,
  conversation,
}: ConversationScreenProps) {
  const [messages, dispatchMessages] = useReducer(
    (state: Message[], action: Message | null) => {
      if (action) {
        const newState = [...state];
        newState[Number(action.id)] = action;
        return newState;
      } else return [];
    },
    []
  );

  // reset initial value for messages
  useEffect(() => dispatchMessages(null), [conversation]);

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
      {Array(conversation.length)
        .fill(0)
        .map((_, index) => index)
        .map((index: number) => (
          <MessageLoader
            key={index}
            socket={socket}
            cid={conversation.id}
            mid={index.toString()}
            onLoad={dispatchMessages}
          />
        ))}
      {messages.map((m: Message) => (
        <p key={m.id}>{m.body}</p>
      ))}
    </div>
  );
}
