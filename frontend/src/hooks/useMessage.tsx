import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

export type Message = {
  id: string;
  body: string | null;
  status: "ok" | "queued" | "sending" | "draft" | "deleted" | "error";
  isMine: boolean;
  lastModified: string;
};

export default function useMessage(
  socket: Socket | null,
  cid: string,
  mid: string,
): Message | null {
  const [message, setMessage] = useState<Message | null>(null);

  // fetch message data
  useEffect(() => {
    if (socket)
      socket.emit("get-message", cid, mid, (m: Message) => {
        setMessage(m);
      });
  }, [socket, cid, mid, setMessage]);

  // receive message-updates
  useEffect(() => {
    const eventName = "update-message-" + cid + "." + mid;
    if (socket) {
      socket.on(
        eventName,
        ({ cid: _cid, message: _message }: { cid: string; message: Message }) => {
          setMessage(_message);
        }
      );
      return () => {
        socket.off(eventName);
      };
    }
  }, [socket, cid, mid, setMessage]);

  return message;
}
