import { useState, useEffect, useCallback, createContext } from "react";
import { Socket, io } from "socket.io-client";
import { Button, Card, Alert } from "flowbite-react";
import { FiAlertCircle } from "react-icons/fi";

import { Conversation } from "./hooks/useConversation";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import SetupDialog from "./modals/Setup";
import LoginDialog from "./modals/Login";
import ConfigurationDialog from "./modals/Configuration";

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
    fetch(ApiUrl + "/auth/key").then((response) => {
      setSetup(response.ok);
      setSetupChecked(true);
      checkLogin();
    });
  }, [setSetupChecked, setSetup, checkLogin]);

  // configuration
  const [configuration, setConfiguration] = useState<boolean>(false);

  // setup status
  useEffect(checkSetup, [checkSetup]);

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
    if (loggedIn && !socket.connected) socket.connect();
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [loggedIn]);

  return (
    <SocketContext.Provider value={socketConnected ? socket : null}>
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
      <div className="flex flex-row">
        <div>
          <Sidebar
            connected={socketConnected}
            url={ApiUrl}
            selectedConversation={activeConversationId}
            onConversationClick={(c: Conversation) => {
              setActiveConversationId(c.id);
            }}
            menuItems={[
              ...(loggedIn
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
          <div className="w-full h-screen place-content-center place-items-center">
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
        {activeConversationId ? <Chat cid={activeConversationId} /> : null}
      </div>
    </SocketContext.Provider>
  );
}
