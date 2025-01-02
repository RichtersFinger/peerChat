import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { Sidebar, Avatar, Button } from "flowbite-react";

const ApiUrl = process.env.REACT_APP_API_BASE_URL ?? "http://localhost:5000";
const socket = io(ApiUrl, {
  autoConnect: false,
  withCredentials: true,
});

const authKey = "peerChatAuth";

type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
  avatar?: string;
};

export default function App() {
  const pingRef = useRef<HTMLParagraphElement>(null);
  const eventRef = useRef<HTMLParagraphElement>(null);
  const createKeyInputRef = useRef<HTMLInputElement>(null);
  const createKeyRef = useRef<HTMLParagraphElement>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
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
  }, [setUserAvatar]);

  // load user-name
  useEffect(() => {
    fetch(ApiUrl + "/api/v0/user/name")
      .then((response) => response.text())
      .then((text) => {
        setUserName(text);
      });
  }, [setUserName]);

  // configure socket and connect
  useEffect(() => {
    socket.on("connect", () => {
      setSocketConnected(true);
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
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("event-response", (value) => {
      if (eventRef.current) eventRef.current.innerText = JSON.stringify(value);
    });
    if (!socket.connected) socket.connect();
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [setConversations]);

  return (
    <div className="flex flex-row">
      <div>
        <Sidebar
          className="select-none h-screen sticky top-0 left-0"
          theme={{
            root: {
              inner:
                "w-52 h-full overflow-y-auto overflow-x-hidden bg-slate-200 px-1 py-2 flex flex-col justify-between",
            },
          }}
        >
          <div>
            <Sidebar.Logo href="#" img="/peerChat.svg" imgAlt="peerChat">
              peerChat
            </Sidebar.Logo>
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
          <Sidebar.Items>
            <Sidebar.ItemGroup>
              <Sidebar.Item>+ New Conversation</Sidebar.Item>
              {Object.values(conversations)
                .sort((a: Conversation, b: Conversation) =>
                  a.lastModified > b.lastModified
                    ? 1
                    : b.lastModified > a.lastModified
                    ? -1
                    : 0
                )
                .map((c: Conversation) => (
                  <Sidebar.Item key={c.id}>{c.name ?? c.id}</Sidebar.Item>
                ))}
            </Sidebar.ItemGroup>
          </Sidebar.Items>
        </Sidebar>
      </div>
      <div className="m-2 space-y-2">
        <Button
          size="xs"
          onClick={() => {
            fetch(ApiUrl + "/ping")
              .then((response) => response.text())
              .then((text) => {
                if (pingRef.current) pingRef.current.innerText = text;
              });
          }}
        >
          ping
        </Button>
        <p ref={pingRef}></p>
        <input ref={createKeyInputRef} type="text" />
        <Button
          size="xs"
          onClick={() => {
            fetch(ApiUrl + "/auth/key", {
              method: "POST",
              body: JSON.stringify(
                createKeyInputRef.current
                  ? { [authKey]: createKeyInputRef.current.value }
                  : {}
              ),
              headers: { "content-type": "application/json" },
            })
              .then((response) => {
                return { status: response.status, text: response.text() };
              })
              .then(async (data) => {
                const text = await data.text;
                if (createKeyRef.current) createKeyRef.current.innerText = text;
                if (data.status === 200)
                  document.cookie =
                    authKey + "=" + text + "; path=/; max-age:2147483647";
              });
          }}
        >
          create key
        </Button>
        <p ref={createKeyRef}></p>
        <Button
          size="xs"
          onClick={() => {
            socket.connect();
          }}
        >
          connect
        </Button>
        <Button
          size="xs"
          onClick={() => {
            socket.disconnect();
          }}
        >
          disconnect
        </Button>
        <Button
          size="xs"
          onClick={() => {
            socket.emit("event", function (data: string) {
              console.log(data);
            });
          }}
        >
          event
        </Button>
        <p ref={eventRef}></p>
      </div>
    </div>
  );
}
