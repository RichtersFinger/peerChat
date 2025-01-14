import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

import useUser from "./useUser";

export type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
  peerName?: string;
  avatar?: string;
};

export default function useConversation(
  socket: Socket,
  cid: string,
  onLoad?: (c: Conversation) => void
): Conversation {
  const [conversation, setConversation] = useState<Conversation>({
    id: cid,
    lastModified: new Date().toISOString(),
  });
  const user = useUser(conversation?.peer);

  // fetch conversation metadata
  useEffect(() => {
    socket.emit("get-conversation", cid, (c: Conversation) => {
      setConversation(c);
      if (onLoad) onLoad(c);
    });
  }, [socket, cid, onLoad, setConversation]);

  // merge user-info into conversation metadata
  useEffect(() => {
    if (
      onLoad &&
      ((user.name && !conversation.peerName) ||
        (user.avatar && !conversation.avatar))
    ) {
      const newConversation = {
        ...conversation,
        ...(user.name ? { peerName: user.name } : {}),
        ...(user.avatar ? { avatar: user.avatar } : {}),
      };
      setConversation(newConversation);
      onLoad(newConversation);
    }
  }, [user, conversation, setConversation, onLoad]);

  return conversation;
}
