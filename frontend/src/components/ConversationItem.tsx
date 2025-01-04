import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { Sidebar as FBSidebar } from "flowbite-react";

export type ConversationItemProps = {
  socket: Socket;
  cid: string;
};

export type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
  avatar?: string;
};

export default function ConversationItem({
  socket,
  cid,
}: ConversationItemProps) {
  const [conversation, setConversation] = useState<Conversation>({
    id: cid,
    lastModified: new Date().toISOString(),
  });

  useEffect(() => {
    socket.emit("get-conversation", cid, (c: Conversation) =>
      setConversation(c)
    );
  }, [socket, cid, setConversation]);

  return (
    <FBSidebar.Item>{conversation.name ?? conversation.id}</FBSidebar.Item>
  );
}
