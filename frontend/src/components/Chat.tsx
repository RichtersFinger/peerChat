import { useEffect, useState, useRef, useContext } from "react";
import { Avatar, Button, Textarea } from "flowbite-react";

import { SocketContext } from "../App";
import useConversation from "../hooks/useConversation";
import ChatHeader from "./ChatHeader";
import ChatMessageItem from "./ChatMessageItem";

export type ChatProps = {
  cid: string;
};

const DEFAULT_NMESSAGES = 10;
const DEFAULT_NMESSAGES_INCREMENT = 10;

export default function Chat({ cid }: ChatProps) {
  const socket = useContext(SocketContext);
  const conversation = useConversation(socket, cid);
  const [nMessages, setNMessages] = useState<number>(DEFAULT_NMESSAGES);
  const newMessageRef = useRef<HTMLTextAreaElement>(null);

  // reset initial values for states if cid changes
  useEffect(() => {
    setNMessages(DEFAULT_NMESSAGES);
  }, [cid]);

  if (!socket) return null;
  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden">
      <ChatHeader conversation={conversation}/>
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
              <ChatMessageItem key={mid} cid={cid} mid={mid.toString()} />
            ))
            .reverse()}
        </div>
      </div>
      <div className="flex flex-row space-x-2 p-4">
        <Textarea ref={newMessageRef} placeholder="Your message..." rows={3} />
        <div>
          <Button
            onClick={() => {
              socket.emit(
                "post-message",
                conversation.id,
                { body: newMessageRef.current?.value, isMine: true },
                (mid: number) => {
                  if (newMessageRef.current?.value)
                    newMessageRef.current.value = "";
                  socket.emit("send-message", cid, mid.toString());
                }
              );
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
