import { useContext } from "react";
import { Sidebar as FBSidebar } from "flowbite-react";

import { SocketContext } from "../App";
import useConversationList from "../hooks/useConversationList";
import { Conversation } from "../hooks/useConversation";
import SidebarUserItem from "./SidebarUserItem";
import SidebarConversationItem from "./SidebarConversationItem";

export type SidebarProps = {
  connected: boolean;
  url: string;
  onConversationClick?: (c: Conversation) => void;
};

export default function Sidebar({
  connected,
  url,
  onConversationClick,
}: SidebarProps) {
  const socket = useContext(SocketContext);
  const cids = useConversationList(socket);

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
          <SidebarUserItem connected={connected} url={url}/>
        </div>
        <FBSidebar.Items>
          <FBSidebar.ItemGroup>
            <FBSidebar.Item>+ New Conversation</FBSidebar.Item>
            {cids.map((cid: string) => (
                <SidebarConversationItem
                  key={cid}
                  cid={cid}
                  onClick={onConversationClick}
                />
              ))}
          </FBSidebar.ItemGroup>
        </FBSidebar.Items>
      </FBSidebar>
    </>
  );
}
