import { Sidebar as FBSidebar } from "flowbite-react";

import { Conversation } from "./ConversationLoader";

export type ConversationItemProps = {
  conversation: Conversation;
};

export default function ConversationItem({
  conversation,
}: ConversationItemProps) {
  return (
    <FBSidebar.Item>{conversation.name ?? conversation.id}</FBSidebar.Item>
  );
}
