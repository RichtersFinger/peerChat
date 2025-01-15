import { useContext } from "react";
import { Sidebar as FBSidebar, Avatar } from "flowbite-react";

import { SocketContext } from "../App";
import useUser from "../hooks/useUser";
import useConversationList from "../hooks/useConversationList";
import { Conversation } from "../hooks/useConversation";
import ConversationItem from "./ConversationItem";

export type SidebarProps = {
  connected: boolean;
  ApiUrl?: string;
  onConversationClick?: (c: Conversation) => void;
};

export default function Sidebar({
  connected,
  ApiUrl,
  onConversationClick,
}: SidebarProps) {
  const user = useUser(ApiUrl);
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
              <p className="max-w-48 truncate text-sm text-gray-500">
                {ApiUrl}
              </p>
            </div>
          </div>
        </div>
        <FBSidebar.Items>
          <FBSidebar.ItemGroup>
            <FBSidebar.Item>+ New Conversation</FBSidebar.Item>
            {cids.map((cid: string) => (
                <ConversationItem
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
