import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { Sidebar as FBSidebar, Avatar } from "flowbite-react";

import ConversationItem from "./ConversationItem";

export type SidebarProps = {
  socket: Socket;
  ApiUrl: string;
};

export default function Sidebar({ socket, ApiUrl }: SidebarProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [cids, setCids] = useState<string[]>([]);

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

  // connection status indicator
  useEffect(() => {
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
}, [socket, ApiUrl, setCids]);

  // fetch conversation index
  useEffect(() => {
    if (socket.connected)
      socket.emit("list-conversations", (cids_: string[]) => setCids(cids_));
  }, [socket, socketConnected]);

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
          {cids.map((cid: string) => (
            <ConversationItem key={cid} socket={socket} cid={cid} />
          ))}
        </FBSidebar.ItemGroup>
      </FBSidebar.Items>
    </FBSidebar>
  );
}
