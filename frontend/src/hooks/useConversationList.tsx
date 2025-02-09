import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

export default function useConversationList(socket: Socket | null): string[] {
  const [cids, setCids] = useState<string[]>([]);

  // initially fetch conversations
  useEffect(() => {
    if (socket)
      socket.emit("list-conversations", (cids_: string[]) => setCids(cids_));
  }, [socket, setCids]);

  // receive new conversations
  useEffect(() => {
    if (socket)
      socket.on("new-conversation", (cid: string) => {
        setCids((cids_) => [...cids_, cid]);
      });
  }, [socket, setCids]);

  return cids;
}
