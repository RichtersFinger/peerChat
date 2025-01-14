import { Sidebar as FBSidebar, Avatar } from "flowbite-react";

import { User } from "../hooks/useUser";
import { Conversation } from "../hooks/useConversation";
import ConversationItem from "./ConversationItem";

export type SidebarProps = {
  connected: boolean;
  conversations: Record<string, Conversation>;
  ApiUrl: string;
  user: User | null;
  onConversationClick?: (c: Conversation) => void;
};

export default function Sidebar({
  connected,
  conversations,
  ApiUrl,
  user,
  onConversationClick,
}: SidebarProps) {
  return (
    <FBSidebar
      className="select-none h-screen sticky top-0 left-0"
      theme={{
        root: {
          inner:
            "w-64 h-full overflow-y-auto overflow-x-hidden bg-slate-200 px-1 py-2 flex flex-col justify-between",
        },
      }}
    >
      <div>
        <FBSidebar.Logo href="#" img="/peerChat.svg" imgAlt="peerChat">
          peerChat
        </FBSidebar.Logo>
        <div className="flex flex-row space-x-2 px-1">
          <Avatar
            {...(user?.avatar ? { img: user.avatar } : {})}
            rounded
            statusPosition="bottom-left"
            status={connected ? "online" : "offline"}
          ></Avatar>
          <div className="flex-col space-y-1 font-medium">
            <p className="max-w-48 truncate font-bold">
              {user?.name ? user.name : "-"}
            </p>
            <p className="max-w-48 truncate text-sm text-gray-500">{ApiUrl}</p>
          </div>
        </div>
      </div>
      <FBSidebar.Items>
        <FBSidebar.ItemGroup>
          <FBSidebar.Item>+ New Conversation</FBSidebar.Item>
          {Object.values(conversations)
            .sort((a: Conversation, b: Conversation) =>
              a.lastModified > b.lastModified
                ? 1
                : b.lastModified > a.lastModified
                ? -1
                : 0
            )
            .map((c: Conversation) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                onClick={onConversationClick}
              />
            ))}
        </FBSidebar.ItemGroup>
      </FBSidebar.Items>
    </FBSidebar>
  );
}
