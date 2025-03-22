import { useRef, useContext } from "react";
import { Button, Textarea } from "flowbite-react";

import { SocketContext } from "../App";

export type ChatInputProps = {
  cid: string;
};

export default function ChatInput({ cid }: ChatInputProps) {
  const socket = useContext(SocketContext);
  const newMessageRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Attempts to send current input as message. Skip if socket is undefined.
   */
  function sendMessage() {
    if (!socket) return;

    socket.emit(
      "post-message",
      cid,
      { body: newMessageRef.current?.value, isMine: true },
      (mid: number) => {
        if (newMessageRef.current?.value) newMessageRef.current.value = "";
        socket.emit("send-message", cid, mid);
      }
    );
  }

  return (
    <div className="flex flex-row space-x-2 p-4">
      <Textarea
        className="text-lg"
        ref={newMessageRef}
        placeholder="Your message..."
        rows={4}
        onKeyDown={(e) => {
          if (!e.shiftKey && e.key === "Enter") sendMessage();
        }}
      />
      <div>
        <Button onClick={() => sendMessage()}>Send</Button>
      </div>
    </div>
  );
}
