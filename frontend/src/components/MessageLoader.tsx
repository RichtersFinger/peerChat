import { useEffect, useContext } from "react";

import { SocketContext } from "../App";

export type Message = {
  id: string;
  body: string | null;
  status: "ok" | "queued" | "sending" | "draft" | "deleted" | "error";
  isMine: boolean;
  lastModified: string;
};

export type MessageLoaderProps = {
  cid: string;
  mid: string;
  onLoad?: (m: Message) => void;
};

export default function MessageLoader({
  cid,
  mid,
  onLoad,
}: MessageLoaderProps) {
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (socket)
      socket.emit("get-message", cid, mid, (m: Message) => {
        if (onLoad) onLoad(m);
      });
  }, [socket, cid, mid, onLoad]);

  return null;
}
