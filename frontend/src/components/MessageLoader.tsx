import { useEffect } from "react";
import { Socket } from "socket.io-client";

export type Message = {
  id: string;
  body: string | null;
  status: "ok" | "queued" | "sending" | "draft" | "deleted" | "error";
  isMine: boolean;
  lastModified: string;
};

export type MessageLoaderProps = {
  socket: Socket;
  cid: string;
  mid: string;
  onLoad?: (m: Message) => void;
};

export default function MessageLoader({
  socket,
  cid,
  mid,
  onLoad,
}: MessageLoaderProps) {
  useEffect(() => {
    socket.emit("get-message", cid, mid, (m: Message) => {
      if (onLoad) onLoad(m);
    });
  }, [socket, cid, mid, onLoad]);

  return null;
}
