import { useRef, useContext } from "react";
import { Button, Textarea } from "flowbite-react";

import { SocketContext } from "../App";

export type ChatInputProps = {
  cid: string;
};

export default function ChatInput({ cid }: ChatInputProps) {
  const socket = useContext(SocketContext);
  const newMessageRef = useRef<HTMLTextAreaElement>(null);

  if (!socket) return null;
  return (
    <div className="flex flex-row space-x-2 p-4">
      <Textarea ref={newMessageRef} placeholder="Your message..." rows={3} />
      <div>
        <Button
          onClick={() => {
            socket.emit(
              "post-message",
              cid,
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
  );
}
