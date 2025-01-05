import { useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";

import UserLoader, { User } from "./UserLoader";

export type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
  peerName?: string;
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
  const conversationRef = useRef<Conversation | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(
    conversationRef.current
  );

  useEffect(() => {
    socket.emit("get-conversation", cid, (c: Conversation) => {
      conversationRef.current = c;
      if (onLoad) onLoad(conversationRef.current);
      setConversation(conversationRef.current);
    });
  }, [socket, cid, onLoad, setConversation]);

  return conversation?.peer ? (
    <UserLoader
      url={conversation.peer}
      onLoad={(u: User) => {
        if (conversationRef.current) {
          conversationRef.current = {
            ...conversationRef.current,
            ...(u?.name ? { peerName: u.name } : {}),
            ...(u?.avatar ? { avatar: u.avatar } : {}),
          };
          if (onLoad) onLoad(conversationRef.current);
        }
      }}
    />
  ) : null;
}
