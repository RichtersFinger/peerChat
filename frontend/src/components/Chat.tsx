import { useContext } from "react";

import { SocketContext } from "../App";
import useConversation from "../hooks/useConversation";
import ChatHeader from "./ChatHeader";
import ChatBody from "./ChatBody";
import ChatInput from "./ChatInput";

export type ChatProps = {
  cid: string;
};

export default function Chat({ cid }: ChatProps) {
  const socket = useContext(SocketContext);
  const conversation = useConversation(socket, cid);

  if (!socket) return null;
  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden">
      <ChatHeader conversation={conversation} />
      <ChatBody conversation={conversation} />
      <ChatInput cid={conversation.id} />
    </div>
  );
}
