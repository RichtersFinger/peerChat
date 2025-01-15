import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

export type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
};

export default function useConversation(
  socket: Socket | null,
  cid: string,
  onUpdate?: (c: Conversation) => void
): Conversation {
  const [conversation, setConversation] = useState<Conversation>({
    id: cid,
    lastModified: new Date().toISOString(),
  });

  // fetch conversation metadata
  useEffect(() => {
    if (socket)
      socket.emit("get-conversation", cid, (c: Conversation) => {
        setConversation(c);
      });
  }, [socket, cid, setConversation]);

  // receive conversation-updates
  useEffect(() => {
    const eventName = "update-conversation-" + cid;
    if (socket) {
      socket.on(eventName, (c: Conversation) => {
        setConversation(c);
        if (onUpdate) onUpdate(c);
      });
      return () => {
        socket.off(eventName);
      };
    }
  }, [socket, cid, onUpdate, setConversation]);

  return conversation;
}
