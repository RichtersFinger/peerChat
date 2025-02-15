import { useState, useEffect } from "react";
import { Button } from "flowbite-react";

import { Conversation } from "../stores";
import ChatMessageItem from "./ChatMessageItem";

export type ChatBodyProps = {
  conversation: Conversation;
};

const DEFAULT_NMESSAGES = 10;
const DEFAULT_NMESSAGES_INCREMENT = 10;

export default function ChatBody({ conversation }: ChatBodyProps) {
  const [nMessages, setNMessages] = useState<number>(DEFAULT_NMESSAGES);

  // reset initial values for state if conversation changes
  useEffect(() => {
    setNMessages(DEFAULT_NMESSAGES);
  }, [conversation]);

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
        {Array(Math.min(conversation.length ?? 0, nMessages))
          .fill(0)
          .map((_, index) => (conversation.length ?? 0) - 1 - index)
          .map((mid: number) => (
            <ChatMessageItem
              key={mid}
              cid={conversation.id}
              mid={mid.toString()}
            />
          ))
          .reverse()}
      </div>
    </div>
  );
}
