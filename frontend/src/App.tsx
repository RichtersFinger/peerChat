import { useState, useRef, useEffect, useReducer } from "react";
import { io } from "socket.io-client";
import { Button } from "flowbite-react";

import useUser from "./hooks/useUser";
import { Conversation } from "./hooks/useConversation";
import ConversationsLoader from "./components/ConversationsLoader";
import Sidebar from "./components/Sidebar";
import ConversationScreen from "./components/ConversationScreen";

const ApiUrl = process.env.REACT_APP_API_BASE_URL ?? "http://localhost:5000";
const socket = io(ApiUrl, {
  autoConnect: false,
  withCredentials: true,
});

const authKey = "peerChatAuth";
const authKeyMaxAge = "2147483647";

export default function App() {
  const pingRef = useRef<HTMLParagraphElement>(null);
  const eventRef = useRef<HTMLParagraphElement>(null);
  const createKeyInputRef = useRef<HTMLInputElement>(null);
  const createKeyRef = useRef<HTMLParagraphElement>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const user = useUser(ApiUrl);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [conversations, dispatchConversations] = useReducer(
    (state: Record<string, Conversation>, action: Conversation) => {
      // update active conversation
      if (!activeConversationId) {
        setActiveConversationId(action.id);
      }

      // exit if already up to date
      if (JSON.stringify(action) === JSON.stringify(state[action.id]))
        return state;
      return {
        ...state,
        [action.id]: { ...state[action.id], ...action },
      };
    },
    {}
  );

  // connection status-tracking
  useEffect(() => {
    socket.on("connect", () => {
      setSocketConnected(true);
      // refresh auth-cookie
      const auth = decodeURIComponent(document.cookie)
        .split(";")
        .find((element: string) => element.trim().startsWith(authKey + "="))
        ?.replace(authKey + "=", "");
      if (auth)
        document.cookie =
          authKey + "=" + auth + "; path=/; max-age=" + authKeyMaxAge;
    });
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
          onConversationLoad={dispatchConversations}
        />
      ) : null}
      <div className="flex flex-row">
        <div>
          <Sidebar
            connected={socketConnected}
            conversations={conversations}
            ApiUrl={ApiUrl}
            user={user}
            onConversationClick={(c: Conversation) => {
              setActiveConversationId(c.id);
            }}
          />
        </div>
        {activeConversationId ? (
          <ConversationScreen
            socket={socket}
            conversation={conversations?.[activeConversationId]}
          />
        ) : null}
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
                      authKey +
                      "=" +
                      text +
                      "; path=/; max-age=" +
                      authKeyMaxAge;
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
