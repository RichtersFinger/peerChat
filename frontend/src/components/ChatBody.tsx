import { useState, useEffect, useContext, useCallback } from "react";
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

export default function ChatBody({ conversation }: ChatBodyProps) {
  const socket = useContext(SocketContext);
  const [nMessages, setNMessages] = useState<number>(DEFAULT_NMESSAGES);
  const [messages, setMessages] = useState<Record<string, Message>>({});

  const pushMessage = useCallback(
    (m: Message) =>
      setMessages((messages) => {
        return { ...messages, [m.id]: m };
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

  // load initial set of messages
  useEffect(() => {
    Array(DEFAULT_NMESSAGES)
      .fill(0)
      .map((_, index) => -index - 1)
      .forEach(pullMessage);
  }, [conversation.id, socket, nMessages, pullMessage]);

  // configure socket events
  useEffect(() => {
    socket?.on(
      "update-message",
      ({ cid, message }: { cid: string; message: Message }) => {
        if (cid !== conversation.id) return;
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
    setNMessages(DEFAULT_NMESSAGES);
  }, [conversation.id]);

  return (
    <div className="m-4 space-y-3 overflow-y-auto h-full">
      <div className="justify-items-center">
        {(conversation.length ?? 0) > 0 &&
        nMessages < (conversation.length ?? 0) ? (
          <div className="flex flex-row space-x-2">
            <Button
              onClick={() =>
                setNMessages((previous: number) =>
                  Math.min(
                    conversation.length ?? 0,
                    previous + DEFAULT_NMESSAGES_INCREMENT
                  )
                )
              }
            >
              Load more
            </Button>
            <Button onClick={() => setNMessages(conversation.length ?? 0)}>
              Load all
            </Button>
          </div>
        ) : null}
      </div>
      <div className="space-y-3">
        {Object.keys(messages)
          .map(Number)
          .sort((a, b) => a - b)
          .map((mid) => (
            <ChatMessageItem key={mid} message={messages[mid.toString()]} />
          ))}
      </div>
    </div>
  );
}
