import { useEffect, useReducer, useState } from "react";
import { Avatar, Button, Spinner } from "flowbite-react";
import { Socket } from "socket.io-client";

import { Conversation } from "./ConversationLoader";
import MessageLoader, { Message } from "./MessageLoader";
import MessageItem from "./MessageItem";

export type ConversationScreenProps = {
  socket: Socket;
  conversation: Conversation;
};

const DEFAULT_NMESSAGES = 3;
const DEFAULT_NMESSAGES_INCREMENT = 1;

export default function ConversationScreen({
  socket,
  conversation,
}: ConversationScreenProps) {
  const [nMessages, setNMessages] = useState<number>(DEFAULT_NMESSAGES);
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

  // reset initial values for states
  useEffect(() => {
    dispatchMessages(null);
    setNMessages(DEFAULT_NMESSAGES);
  }, [conversation]);

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
      {nMessages < (conversation.length ?? 0) ? (
        <Button
          color="blue"
          onClick={() =>
            setNMessages(
              (previous: number) => previous + DEFAULT_NMESSAGES_INCREMENT
            )
          }
        >
          Load more
        </Button>
      ) : null}
      {Array(Math.min(conversation.length ?? 0, nMessages))
        .fill(0)
        .map((_, index) => (conversation.length ?? 0) - 1 - index)
        .map((mid: number) => (
          <MessageLoader
            key={mid}
            socket={socket}
            cid={conversation.id}
            mid={mid.toString()}
            onLoad={dispatchMessages}
          />
        ))}
      {messages.length > 0 ? (
        messages
          .slice((conversation.length ?? 0) - nMessages)
          .map((m: Message, index: number) => (
            <MessageItem key={m?.id ?? "?" + index.toString()} message={m} />
          ))
      ) : (
        <Spinner />
      )}
    </div>
  );
}
