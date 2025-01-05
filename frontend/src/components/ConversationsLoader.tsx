import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import ConversationLoader, { Conversation } from "./ConversationLoader";

export type ConversationsLoaderProps = {
  socket: Socket;
  onConversationLoad?: (c: Conversation) => void;
};

export default function ConversationsLoader({
  socket,
  onConversationLoad,
}: ConversationsLoaderProps) {
  const [cids, setCids] = useState<string[]>([]);

  useEffect(() => {
    if (socket.connected)
      socket.emit("list-conversations", (cids_: string[]) => setCids(cids_));
  }, [socket]);

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
