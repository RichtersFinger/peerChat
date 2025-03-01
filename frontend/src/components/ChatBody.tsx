import { useRef, useState, useEffect, useContext, useCallback } from "react";
import { Button } from "flowbite-react";

import { Conversation } from "../stores";
import { SocketContext } from "../App";
import ChatMessageItem from "./ChatMessageItem";
import { Message } from "./ChatMessageItem";

export type ChatBodyProps = {
  conversation: Conversation;
};

const DEFAULT_NMESSAGES = 10;
const DEFAULT_NMESSAGES_INCREMENT = 10;
const AUTOSCROLL_RANGE = 200;

export default function ChatBody({ conversation }: ChatBodyProps) {
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState<Record<string, Message>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const pushMessage = useCallback(
    (m: Message) =>
      setMessages((messages) => {
        return { ...messages, [m.id.toString()]: m };
      }),
    [setMessages]
  );

  const pullMessage = useCallback(
    (mid: number) =>
      socket?.emit("get-message", conversation.id, mid, (m: Message) => {
        if (m) pushMessage(m);
      }),
    [socket, pushMessage, conversation.id]
  );

  const pullNMessages = useCallback(
    (n: number) => {
      const currentIndex = Math.min(...Object.keys(messages).map(Number));
      for (let index = currentIndex; index >= currentIndex - n; index--) {
        if (index < 0) break;
        pullMessage(index);
      }
    },
    [messages, pullMessage]
  );

  // load initial set of messages
  useEffect(() => {
    for (let index = -1; index >= -DEFAULT_NMESSAGES; index--) {
      pullMessage(index);
    }
  }, [conversation.id, pullMessage]);

  // configure socket events
  useEffect(() => {
    socket?.on(
      "update-message",
      ({ cid, message }: { cid: string; message: Message }) => {
        if (cid !== conversation.id) return;
        socket.emit("mark-conversation-read", cid);
        pushMessage(message);
      }
    );

    return () => {
      socket?.off("update-message");
    };
  }, [conversation.id, socket, pushMessage]);

  // reset initial values for state if conversation changes
  useEffect(() => {
    setMessages({});
  }, [conversation.id]);

  // scroll to new messages
  useEffect(() => {
    if (
      bodyRef.current &&
      AUTOSCROLL_RANGE >=
        Math.abs(
          bodyRef.current.scrollHeight -
            bodyRef.current.offsetHeight -
            bodyRef.current.scrollTop
        )
    ) {
      bodyRef.current?.scrollTo(0, bodyRef.current?.scrollHeight ?? 0);
    }
  }, [messages]);

  return (
    <div
      ref={bodyRef}
      className="flex flex-col m-4 pb-3 pr-2 space-y-3 overflow-y-auto hide-scrollbar hover:show-scrollbar h-full"
    >
      {!Object.keys(messages).includes("0") &&
      Object.keys(messages).length > 0 ? (
        <div className="flex flex-row justify-center space-x-2">
          <Button onClick={() => pullNMessages(DEFAULT_NMESSAGES_INCREMENT)}>
            Load more
          </Button>
          <Button onClick={() => pullNMessages(conversation.length ?? 0)}>
            Load all
          </Button>
        </div>
      ) : null}
      <div className="flex items-end grow">
        {Object.keys(messages).length === 0 ? (
          <div className="flex grow justify-center">
            <span className="text-gray-300">No messages yet</span>
          </div>
        ) : (
          <div className="flex flex-col grow space-y-3 ">
            {Object.keys(messages)
              .map(Number)
              .sort((a, b) => a - b)
              .map((mid) => (
                <ChatMessageItem
                  key={mid}
                  cid={conversation.id}
                  message={messages[mid.toString()]}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
