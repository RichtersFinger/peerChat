import { useEffect } from "react";
import { Socket } from "socket.io-client";

export type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
  avatar?: string;
};

export type ConversationLoaderProps = {
  socket: Socket;
  cid: string;
  onLoad?: (c: Conversation) => void;
};

export default function ConversationLoader({
  socket,
  cid,
  onLoad,
}: ConversationLoaderProps) {
  useEffect(() => {
    socket.emit("get-conversation", cid, (c: Conversation) => {
      if (onLoad) onLoad(c);
    });
  }, [socket, cid, onLoad]);

  return null;
}
