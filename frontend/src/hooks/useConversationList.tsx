import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

export default function useConversationList(socket: Socket | null): string[] {
  const [cids, setCids] = useState<string[]>([]);

  // fetch conversations
  useEffect(() => {
    if (socket)
      socket.emit("list-conversations", (cids_: string[]) => setCids(cids_));
  }, [socket, setCids]);

  return cids;
}
