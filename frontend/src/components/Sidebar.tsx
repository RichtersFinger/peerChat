import { Sidebar as FBSidebar } from "flowbite-react";
import { useShallow } from "zustand/react/shallow";

import useStore, { Conversation } from "../stores";
import SidebarUserItem, { DropdownItemType } from "./SidebarUserItem";
import SidebarConversationItem from "./SidebarConversationItem";

export type SidebarProps = {
  url: string;
  selectedConversation?: string;
  menuItems?: DropdownItemType[];
  onNewConversationClick?: () => void;
  onConversationClick?: (c: Conversation) => void;
};

export default function Sidebar({
  url,
  selectedConversation,
  menuItems,
  onNewConversationClick,
  onConversationClick,
}: SidebarProps) {
  const connected = useStore((state) => state.socket.connected);
  const conversations = useStore(
    useShallow((state) => state.conversations.data)
  );

  return (
    <>
      <FBSidebar
        className="select-none h-screen sticky top-0 left-0"
        theme={{
          root: {
            inner:
              "overflow-y-auto hide-scrollbar hover:show-scrollbar w-[260px] h-full overflow-x-hidden bg-slate-200 py-2 flex flex-col justify-between",
          },
        }}
      >
        <div className="mb-24">
          <FBSidebar.Logo href="#" img="/peerChat.svg" imgAlt="peerChat">
            peerChat
          </FBSidebar.Logo>
          <SidebarUserItem
            connected={connected}
            url={url}
            menuItems={menuItems}
          />
        </div>
        <FBSidebar.Items>
          <FBSidebar.ItemGroup>
            <FBSidebar.Item onClick={onNewConversationClick}>
              + New Conversation
            </FBSidebar.Item>
            {Object.values(conversations)
              .sort((a, b) => (a.lastModified < b.lastModified ? 1 : -1))
              .sort((a, b) => a.unreadMessages && ! b.unreadMessages ? -1 : 1)
              .map((c: Conversation) => (
                <SidebarConversationItem
                  key={c.id}
                  conversation={c}
                  showIndicator={selectedConversation !== c.id}
                  onClick={onConversationClick}
                />
              ))}
          </FBSidebar.ItemGroup>
        </FBSidebar.Items>
      </FBSidebar>
    </>
  );
}
