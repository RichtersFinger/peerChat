import { useState, useEffect } from "react";
import { Sidebar as FBSidebar, Alert, Tooltip } from "flowbite-react";
import { useShallow } from "zustand/react/shallow";
import { FiRefreshCw } from "react-icons/fi";

import { ApiUrl } from "../App";
import useStore, { Conversation } from "../stores";
import SidebarUserItem, { DropdownItemType } from "./SidebarUserItem";
import SidebarConversationItem from "./SidebarConversationItem";
import Upgrade from "../modals/Upgrade";

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
  const [versionString, setVersionString] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { info, setError, setInfo, fetchInfo } = useStore(
    useShallow((state) => ({
      info: state.updates.info,
      setError: state.updates.setError,
      setInfo: state.updates.setInfo,
      fetchInfo: state.updates.fetchInfo,
    }))
  );

  // eslint-disable-next-line
  useEffect(() => fetchInfo(ApiUrl, true), []);

  // fetch software-version
  useEffect(() => {
    fetch(url + "/version")
      .then((response) => {
        if (!response.ok) throw Error("Unable to load software-version.");
        return response.text();
      })
      .then((text) => setVersionString(text))
      .catch((e) => console.error(e));
  }, [url]);

  return (
    <>
      <Upgrade
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
      />
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
          <FBSidebar.Logo
            href=""
            img="/peerChat.svg"
            imgAlt="peerChat"
            onClick={(e) => {
              e.preventDefault();
              setShowUpgradeDialog(true);
            }}
          >
            <div className="relative flex flex-row">
              peerChat
              {versionString ? (
                <span className="w-28 truncate text-gray-400 text-xs transition ease-in-out opacity-0 hover:opacity-100">
                  v{versionString}
                </span>
              ) : null}
              {info?.upgrade ? (
                <Tooltip content="Update available.">
                  <FiRefreshCw className="absolute right-0 text-green-500 hover:text-green-400" />
                </Tooltip>
              ) : null}
            </div>
          </FBSidebar.Logo>
          {info && info.upgrade && !info.declined ? (
            <Alert
              className="mx-1 py-2"
              color="warning"
              onDismiss={() => {
                fetch(ApiUrl + "/update/decline", {
                  method: "PUT",
                  credentials: "include",
                })
                  .then((response) => {
                    if (response.ok) {
                      setInfo({ ...info, declined: true });
                      fetchInfo(ApiUrl, false);
                    }
                  })
                  .catch((error) => setError(error.message));
              }}
            >
              <p
                className="text-xs"
                onClick={() => setShowUpgradeDialog(true)}
              >{`Update available (${info?.current} > ${info?.latest}).`}</p>
            </Alert>
          ) : null}
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
              .sort((a, b) => (a.unreadMessages && !b.unreadMessages ? -1 : 1))
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
