import { useState, useEffect } from "react";
import { Sidebar as FBSidebar, Avatar } from "flowbite-react";

import ConversationItem from "./ConversationItem";
import { Conversation } from "./ConversationLoader";

export type SidebarProps = {
  connected: boolean;
  conversations: Record<string, Conversation>;
  ApiUrl: string;
};

export default function Sidebar({
  connected,
  conversations,
  ApiUrl,
}: SidebarProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // load user-avatar
  useEffect(() => {
    fetch(ApiUrl + "/api/v0/user/avatar")
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && typeof reader.result === "string") {
            setUserAvatar(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      });
  }, [ApiUrl, setUserAvatar]);

  // load user-name
  useEffect(() => {
    fetch(ApiUrl + "/api/v0/user/name")
      .then((response) => response.text())
      .then((text) => {
        setUserName(text);
      });
  }, [ApiUrl, setUserName]);

  return (
    <FBSidebar
      className="select-none h-screen sticky top-0 left-0"
      theme={{
        root: {
          inner:
            "w-52 h-full overflow-y-auto overflow-x-hidden bg-slate-200 px-1 py-2 flex flex-col justify-between",
        },
      }}
    >
      <div>
        <FBSidebar.Logo href="#" img="/peerChat.svg" imgAlt="peerChat">
          peerChat
        </FBSidebar.Logo>
        <Avatar
          {...(userAvatar ? { img: userAvatar } : {})}
          rounded
          statusPosition="bottom-left"
          status={connected ? "online" : "offline"}
        >
          <div className="space-y-1 font-medium">
            <div className="font-bold">{userName ?? "-"}</div>
            <div className="text-sm text-gray-500">{ApiUrl}</div>
          </div>
        </Avatar>
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
              <ConversationItem key={c.id} conversation={c} />
            ))}
        </FBSidebar.ItemGroup>
      </FBSidebar.Items>
    </FBSidebar>
  );
}
