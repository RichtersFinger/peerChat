import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Sidebar as FBSidebar, Avatar } from "flowbite-react";

type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
  avatar?: string;
};

export type SidebarProps = {
  socket: Socket;
  ApiUrl: string;
};

export default function Sidebar({ socket, ApiUrl }: SidebarProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const conversationsRef = useRef<Record<string, Conversation>>({});
  const [conversations, setConversations] = useState<
    Record<string, Conversation>
  >(conversationsRef.current);

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

  useEffect(() => {
    // connection status indicator
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    // fetch contents
    socket.on("connect", () => {
      socket.emit("list-conversations", (cids_: string[]) => {
        // setup Conversation-dummys
        const cs: Record<string, Conversation> = {};
        for (const cid of cids_) {
          Object.assign(cs, {
            [cid]: { id: cid, lastModified: new Date().toISOString() },
          });
        }
        setConversations(cs);
        // fetch full conversation metadata and replace dummys
        for (let cid of cids_) {
          socket.emit("get-conversation", cid, (c: Conversation) => {
            conversationsRef.current = {
              ...conversationsRef.current,
              [cid]: {
                ...conversationsRef.current[cid],
                ...c,
              },
            };
            setConversations(conversationsRef.current);
          });
        }
      });
    });
  }, [socket, ApiUrl]);

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
          status={socketConnected ? "online" : "offline"}
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
              <FBSidebar.Item key={c.id}>{c.name ?? c.id}</FBSidebar.Item>
            ))}
        </FBSidebar.ItemGroup>
      </FBSidebar.Items>
    </FBSidebar>
  );
}
