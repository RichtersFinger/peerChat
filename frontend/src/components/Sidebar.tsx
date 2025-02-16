import { Sidebar as FBSidebar } from "flowbite-react";
import { useShallow } from "zustand/react/shallow";

import useStore, { Conversation } from "../stores";
import SidebarUserItem, { DropdownItemType } from "./SidebarUserItem";
import SidebarConversationItem from "./SidebarConversationItem";

export type SidebarProps = {
  url: string;
  selectedConversation?: string | null;
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
  const cids = useStore(useShallow((state) => state.conversations.ids));
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
              "w-64 h-full overflow-y-auto overflow-x-hidden bg-slate-200 px-1 py-2 flex flex-col justify-between",
          },
        }}
      >
        <div>
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
            {cids.map((cid: string) =>
              conversations[cid] ? (
                <SidebarConversationItem
                  key={cid}
                  conversation={conversations[cid]}
                  showIndicator={selectedConversation !== cid}
                  onClick={onConversationClick}
                />
              ) : null
            )}
          </FBSidebar.ItemGroup>
        </FBSidebar.Items>
      </FBSidebar>
    </>
  );
}
