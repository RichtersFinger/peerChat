import { useEffect, useState, useRef, useContext } from "react";
import { Avatar, Button, Textarea } from "flowbite-react";

import { SocketContext } from "../App";
import useConversation from "../hooks/useConversation";
import ChatHeader from "./ChatHeader";
import ChatBody from "./ChatBody";

export type ChatProps = {
  cid: string;
};

export default function Chat({ cid }: ChatProps) {
  const socket = useContext(SocketContext);
  const conversation = useConversation(socket, cid);
  const newMessageRef = useRef<HTMLTextAreaElement>(null);

  if (!socket) return null;
  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden">
      <ChatHeader conversation={conversation}/>
      <ChatBody conversation={conversation}/>
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
