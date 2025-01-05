import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { Button } from "flowbite-react";

import ConversationsLoader from "./components/ConversationsLoader";
import { Conversation } from "./components/ConversationLoader";
import Sidebar from "./components/Sidebar";

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
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const conversationsRef = useRef<Record<string, Conversation>>({});
  const [conversations, setConversations] = useState<
    Record<string, Conversation>
  >(conversationsRef.current);

  // connection status-tracking
  useEffect(() => {
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
  }, []);

  // configure socket and connect
  useEffect(() => {
    socket.on("event-response", (value) => {
      if (eventRef.current) eventRef.current.innerText = JSON.stringify(value);
    });
    if (!socket.connected) socket.connect();
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, []);

  return (
    <>
      {socketConnected ? (
        <ConversationsLoader
          socket={socket}
          onConversationLoad={(c: Conversation) => {
            conversationsRef.current = {
              ...conversationsRef.current,
              [c.id]: c,
            };
            setConversations(conversationsRef.current);
          }}
        />
      ) : null}
      <div className="flex flex-row">
        <div>
          <Sidebar
            connected={socketConnected}
            conversations={conversations}
            ApiUrl={ApiUrl}
          />
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
                  if (createKeyRef.current)
                    createKeyRef.current.innerText = text;
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
            disabled={socketConnected}
            onClick={() => {
              socket.connect();
            }}
          >
            connect
          </Button>
          <Button
            size="xs"
            disabled={!socketConnected}
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
    </>
  );
}
