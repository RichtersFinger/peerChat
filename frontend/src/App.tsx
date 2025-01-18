import { useState, useEffect, useCallback, createContext } from "react";
import { Socket, io } from "socket.io-client";
import { Button, Card, Alert } from "flowbite-react";
import { FiAlertCircle } from "react-icons/fi";

import { Conversation } from "./hooks/useConversation";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import SetupDialog from "./modals/Setup";

export const ApiUrl = process.env.REACT_APP_API_BASE_URL ?? window.origin;
const socket = io(ApiUrl, {
  autoConnect: false,
  withCredentials: true,
});
export const SocketContext = createContext<Socket | null>(null);

export const authKey = "peerChatAuth";
export const authKeyMaxAge = "2147483647";

export default function App() {
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [configured, setConfigured] = useState<boolean>(true);
  const [configurationDialog, setConfigurationDialog] =
    useState<boolean>(false);
  const checkConfiguration = useCallback(() => {
    fetch(ApiUrl + "/auth/key")
      .then((response) => {
        setConfigured(response.ok);
      })
      .catch((error) => {
        console.error("Failed to fetch resource: ", error);
      });
  }, [setConfigured]);

  // configuration status
  useEffect(checkConfiguration, [checkConfiguration]);

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
    if (!socket.connected) socket.connect();
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [configured]);

  return (
    <SocketContext.Provider value={socketConnected ? socket : null}>
      <SetupDialog
        open={configurationDialog}
        onClose={() => {
          setConfigurationDialog(false);
          checkConfiguration();
        }}
      />
      <div className="flex flex-row">
        <div>
          <Sidebar
            connected={socketConnected}
            url={ApiUrl}
            selectedConversation={activeConversationId}
            onConversationClick={(c: Conversation) => {
              setActiveConversationId(c.id);
            }}
          />
        </div>
        {!configured ? (
          <div className="w-full h-screen flex flex-col place-content-center place-items-center">
            <Card className="m-2 min-w-96 max-w-96">
              <h5 className="text-xl font-bold">Configuration</h5>
              <Alert color="failure" icon={FiAlertCircle}>
                This server has not been configured yet.
              </Alert>
              <Button onClick={() => setConfigurationDialog(true)}>
                Configure
              </Button>
            </Card>
          </div>
        ) : null}
        {activeConversationId ? <Chat cid={activeConversationId} /> : null}
      </div>
    </SocketContext.Provider>
  );
}
