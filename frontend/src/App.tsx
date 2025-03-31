import { useState, useEffect, useCallback, createContext } from "react";
import { useShallow } from "zustand/react/shallow";
import { Socket, io } from "socket.io-client";
import { Button, Card, Alert } from "flowbite-react";
import { FiAlertCircle } from "react-icons/fi";

import useStore, { Conversation } from "./stores";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import SetupDialog from "./modals/Setup";
import LoginDialog from "./modals/Login";
import ConfigurationDialog from "./modals/Configuration";
import NewConversationDialog from "./modals/NewConversation";

export const ApiUrl = process.env.REACT_APP_API_BASE_URL ?? window.origin;
const socket = io(ApiUrl, {
  autoConnect: false,
  withCredentials: true,
});
export const SocketContext = createContext<Socket | null>(null);

export const authKey = "peerChatAuth";
export const authKeyMaxAge = "2147483647";

export default function App() {
  const socketState = useStore(useShallow((state) => state.socket));
  const conversations = useStore(useShallow((state) => state.conversations));
  const activeConversation = useStore(
    useShallow((state) => state.activeConversation)
  );
  const peers = useStore(useShallow((state) => state.peers));

  // login
  const [loginChecked, setLoginChecked] = useState<boolean>(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [loginDialog, setLoginDialog] = useState<boolean>(false);
  const checkLogin = useCallback(() => {
    fetch(
      ApiUrl + "/auth/test",
      process.env.REACT_APP_API_BASE_URL ? { credentials: "include" } : {}
    ).then(async (response) => {
      setLoggedIn(response.ok);
      setLoginChecked(true);
      if (response.ok && !socket.connected) {
        socket.connect();
      }
    });
  }, [setLoginChecked, setLoggedIn]);

  // setup
  const [setupChecked, setSetupChecked] = useState<boolean>(false);
  const [setup, setSetup] = useState<boolean>(false);
  const [setupDialog, setSetupDialog] = useState<boolean>(false);
  const checkSetup = useCallback(() => {
    fetch(ApiUrl + "/auth/key")
      .then((response) => {
        setSetup(response.ok);
        setSetupChecked(true);
        checkLogin();
      })
      .catch((error) => console.error("Failed to fetch resource: ", error));
  }, [setSetupChecked, setSetup, checkLogin]);

  // configuration
  const [configuration, setConfiguration] = useState<boolean>(false);

  // new conversation
  const [newConversation, setNewConversation] = useState<boolean>(false);

  // setup status
  useEffect(checkSetup, [checkSetup]);

  // route to conversation
  useEffect(() => {
    const activeId = new URLSearchParams(window.location.search).get("cid");
    if (activeId) activeConversation.setId(activeId);
  }, [activeConversation]);

  // connection status-tracking
  useEffect(() => {
    socket.on("connect", () => {
      socketState.connect();
      conversations.fetchAll(socket);
      conversations.listen(socket);
      peers.listen(socket);
      socket.emit("inform-peers");
      // refresh auth-cookie
      const auth = decodeURIComponent(document.cookie)
        .split(";")
        .find((element: string) => element.trim().startsWith(authKey + "="))
        ?.replace(authKey + "=", "");
      if (auth)
        document.cookie =
          authKey + "=" + auth + "; path=/; max-age=" + authKeyMaxAge;
    });
    socket.on("disconnect", () => {
      socketState.disconnect();
      conversations.stopListening(socket);
      peers.stopListening(socket);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    }
  }, [socketState, conversations, peers]);

  // configure socket and connect
  useEffect(() => {
    if (loggedIn && !socket.connected) socket.connect();
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [loggedIn]);

  return (
    <SocketContext.Provider value={socketState.connected ? socket : null}>
      <SetupDialog
        open={setupDialog}
        onClose={() => {
          setSetupDialog(false);
          checkSetup();
        }}
      />
      <LoginDialog
        open={loginDialog}
        onClose={() => {
          setLoginDialog(false);
          checkLogin();
        }}
        onLogin={() => {
          setLoginDialog(false);
          checkLogin();
        }}
      />
      <ConfigurationDialog
        open={configuration}
        onClose={() => setConfiguration(false)}
      />
      <NewConversationDialog
        open={newConversation}
        onSuccess={(cid) => activeConversation.setId(cid)}
        onClose={() => setNewConversation(false)}
      />
      <div className="flex flex-row">
        <div>
          <Sidebar
            url={ApiUrl}
            onNewConversationClick={() => setNewConversation(true)}
            selectedConversation={activeConversation.id}
            onConversationClick={(c: Conversation) => {
              socket.emit("mark-conversation-read", c.id);
              activeConversation.setId(c.id);
            }}
            menuItems={[
              ...(loggedIn && socketState.connected
                ? [
                    {
                      label: "Settings",
                      onClick: () => setConfiguration(true),
                    },
                    {
                      label: "Logout",
                      onClick: () => {
                        document.cookie =
                          authKey +
                          "=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
                        window.location.reload();
                      },
                    },
                  ]
                : []),
            ]}
          />
        </div>
        {(setupChecked && !setup) || (loginChecked && !loggedIn) ? (
          <div className="flex w-full h-screen place-content-center place-items-center">
            <Card className="min-w-96 max-w-96">
              {setupChecked && !setup ? (
                <>
                  <h5 className="text-xl font-bold">Setup</h5>
                  <Alert color="failure" icon={FiAlertCircle}>
                    This server has not been configured yet.
                  </Alert>
                  <Button onClick={() => setSetupDialog(true)}>
                    Configure
                  </Button>
                </>
              ) : loginChecked && !loggedIn ? (
                <>
                  <h5 className="text-xl font-bold">Login</h5>
                  <Alert color="failure" icon={FiAlertCircle}>
                    Missing or bad credentials.
                  </Alert>
                  <Button onClick={() => setLoginDialog(true)}>Login</Button>
                </>
              ) : null}
            </Card>
          </div>
        ) : null}
        {activeConversation.id ? <Chat cid={activeConversation.id} /> : null}
      </div>
    </SocketContext.Provider>
  );
}
