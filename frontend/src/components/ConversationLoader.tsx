import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

import useUser from "../hooks/useUser";

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
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const user = useUser(conversation?.peer);

  useEffect(() => {
    socket.emit("get-conversation", cid, (c: Conversation) => {
      setConversation(c);
      if (onLoad) onLoad(c);
    });
  }, [socket, cid, onLoad, setConversation]);

  useEffect(() => {
    if (conversation) {
      if (onLoad)
        onLoad({
          ...conversation,
          ...(user.name ? { peerName: user.name } : {}),
          ...(user.avatar ? { avatar: user.avatar } : {}),
        });
    }
  }, [user, conversation, onLoad]);
  return null;
}
