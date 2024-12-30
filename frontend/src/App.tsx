import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { Sidebar, Avatar, Button } from "flowbite-react";

const ApiUrl = process.env.REACT_APP_API_BASE_URL ?? "http://localhost:5000";
const socket = io(ApiUrl, {
  autoConnect: false,
  withCredentials: true,
});

const authKey = "peerChatAuth";

export default function App() {
  const pingRef = useRef<HTMLParagraphElement>(null);
  const eventRef = useRef<HTMLParagraphElement>(null);
  const createKeyInputRef = useRef<HTMLInputElement>(null);
  const createKeyRef = useRef<HTMLParagraphElement>(null);
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
  }, [setUserAvatar]);

  // load user-name
  useEffect(() => {
    fetch(ApiUrl + "/api/v0/user/name")
      .then((response) => response.text())
      .then((text) => {
        setUserName(text);
      });
  }, [setUserName]);

  socket.on("event-response", (value) => {
    if (eventRef.current) eventRef.current.innerText = JSON.stringify(value);
  });

  return (
    <div className="flex flex-row">
      <div className="h-full">
        <Sidebar
          className="select-none h-screen"
          theme={{
            root: {
              inner:
                "w-64 h-full overflow-y-auto bg-slate-200 overflow-x-hidden px-1 py-2 flex flex-col justify-between",
            },
          }}
        >
          <div>
            <Sidebar.Logo href="#" img="/peerChat.svg" imgAlt="peerChat">
              peerChat
            </Sidebar.Logo>
            <Avatar {...(userAvatar ? { img: userAvatar } : {})} rounded>
              <div className="space-y-1 font-medium">
                <div className="font-bold">{userName ?? "-"}</div>
                <div className="text-sm text-gray-500">{ApiUrl}</div>
              </div>
            </Avatar>
          </div>
          <Sidebar.Items>
            <Sidebar.ItemGroup>
              <Sidebar.Item>+ New Conversation</Sidebar.Item>
              <Sidebar.Item>Chat 1</Sidebar.Item>
              <Sidebar.Item>Chat 2</Sidebar.Item>
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
