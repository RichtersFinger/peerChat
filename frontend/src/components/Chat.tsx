import { useContext } from "react";
import { useShallow } from "zustand/react/shallow";

import { SocketContext } from "../App";
import useStore from "../stores";
import ChatHeader from "./ChatHeader";
import ChatBody from "./ChatBody";
import ChatInput from "./ChatInput";

export type ChatProps = {
  cid: string;
};

export default function Chat({ cid }: ChatProps) {
  const socket = useContext(SocketContext);
  const conversations = useStore(useShallow((state) => state.conversations.data));

  if (!socket) return null;
  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden">
      <ChatHeader conversation={conversations[cid]} />
      <ChatBody conversation={conversations[cid]} />
      <ChatInput cid={cid} />
    </div>
  );
}
