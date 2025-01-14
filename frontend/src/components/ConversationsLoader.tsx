import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

import useConversation, { Conversation } from "../hooks/useConversation";

export type ConversationsLoaderProps = {
  socket: Socket;
  onConversationLoad?: (c: Conversation) => void;
};

type ConversationLoaderProps = {
  socket: Socket;
  cid: string;
  onLoad?: (c: Conversation) => void;
};

function ConversationLoader({
  socket,
  cid,
  onLoad,
}: ConversationLoaderProps) {
  useConversation(socket, cid, onLoad);
  return null;
}

export default function ConversationsLoader({
  socket,
  onConversationLoad,
}: ConversationsLoaderProps) {
  const [cids, setCids] = useState<string[]>([]);

  useEffect(() => {
    if (socket.connected)
      socket.emit("list-conversations", (cids_: string[]) => setCids(cids_));
  }, [socket, setCids]);

  return (
    <>
      {cids.map((cid: string) => (
        <ConversationLoader
          key={cid}
          socket={socket}
          cid={cid}
          onLoad={onConversationLoad}
        />
      ))}
    </>
  );
}
