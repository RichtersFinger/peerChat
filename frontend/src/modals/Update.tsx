import { useContext, useState, useEffect, useRef } from "react";
import { Modal, Spinner, Alert, Button } from "flowbite-react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

import useStore from "../stores";
import { ApiUrl, SocketContext } from "../App";

type UpdateProps = {
  open: boolean;
  onClose?: () => void;
};

export default function Update({ open, onClose }: UpdateProps) {
  const socket = useContext(SocketContext);
  const [runningUpdate, setRunningUpdate] = useState(false);
  const logRef = useRef<HTMLTextAreaElement>(null);
  const updates = useStore((state) => state.updates);

  // configure socket events
  useEffect(() => {
    socket?.on("starting-update", () => {
      setRunningUpdate(true);
    });
    socket?.on("update-log", (message: string) => {
      updates.addToLog(message);
      logRef.current?.scrollTo(0, logRef.current?.scrollHeight);
    });
    socket?.on("update-error", (message: string) => {
      console.log(message);
      updates.setError(message);
      logRef.current?.scrollTo(0, logRef.current?.scrollHeight);
      setRunningUpdate(false);
    });
    socket?.on("update-complete", () => {
      logRef.current?.scrollTo(0, logRef.current?.scrollHeight);
      updates.fetchInfo(ApiUrl, true);
      setRunningUpdate(false);
    });
    return () => {
      socket?.off("starting-update");
      socket?.off("update-log");
      socket?.off("update-error");
      socket?.off("update-complete");
    };
    // eslint-disable-next-line
  }, [socket]);

  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="flex flex-row justify-between mb-1">
          <h5 className="text-xl font-bold">Update</h5>
          <Button
            disabled={
              runningUpdate ||
              (updates.info === undefined && updates.error === undefined)
            }
            className="aspect-square items-center"
            size="xs"
            onClick={() => {
              updates.setInfo();
              updates.fetchInfo(ApiUrl, false);
            }}
          >
            <FiRefreshCw size={15} />
          </Button>
        </div>
        <div className="space-y-2">
          {updates.info &&
          updates.info?.installed &&
          updates.info.current !== updates.info.installed ? (
            <Alert color="warning" icon={FiAlertCircle}>
              The application needs to be restarted for changes to take effect.
            </Alert>
          ) : null}
          {updates.error ? (
            <Alert color="failure" icon={FiAlertCircle}>
              {updates.error}
            </Alert>
          ) : null}
          {!updates.info && !updates.error ? (
            <div className="flex w-full justify-center">
              <Spinner size="xl" />
            </div>
          ) : null}
          {updates.info ? (
            <>
              <div className="flex flex-col space-y-2 pt-4">
                <div className="flex flex-row justify-between">
                  <span>
                    {`Current version: ${updates.info.current}`}{" "}
                    {updates.info?.installed &&
                    updates.info.current !== updates.info.installed
                      ? `(installed ${updates.info.installed})`
                      : null}
                  </span>
                  {updates.info.latest ? (
                    <span>{"Latest version: " + updates.info.latest}</span>
                  ) : null}
                </div>
                {updates.info.changelog ? (
                  <textarea
                    className="bg-gray-100 h-64 rounded-xl font-mono resize-none overflow-y-auto hide-scrollbar hover:show-scrollbar"
                    disabled={true}
                    value={updates.info.changelog}
                  />
                ) : null}
                {(runningUpdate || updates.log.length > 0) && (
                  <textarea
                    ref={logRef}
                    className="dark bg-gray-800 text-gray-200 h-64 rounded-xl font-mono resize-none overflow-y-auto hide-scrollbar hover:show-dark-scrollbar"
                    disabled={true}
                    value={updates.log?.join("\n")}
                  />
                )}
              </div>
              <div className="flex flex-row space-x-5">
                <Button
                  color="failure"
                  disabled={
                    runningUpdate ||
                    !updates.info?.upgrade ||
                    updates.info?.declined
                  }
                  onClick={() =>
                    fetch(ApiUrl + "/update/decline", {
                      method: "PUT",
                      credentials: "include",
                    })
                      .then((response) => {
                        if (!response.ok)
                          throw new Error(
                            "Unexpected error while declining update: " +
                              response.statusText
                          );
                        if (response.ok) {
                          updates.setInfo();
                          updates.fetchInfo(ApiUrl, false);
                          onClose?.();
                        }
                      })
                      .catch((error) => updates.setError(error.message))
                  }
                >
                  Decline
                </Button>
                <Button
                  color="success"
                  disabled={runningUpdate || !updates.info?.upgrade}
                  onClick={() =>
                    fetch(ApiUrl + "/update/run", {
                      method: "PUT",
                      credentials: "include",
                    })
                      .then((response) => {
                        if (!response.ok)
                          throw new Error(
                            "Unexpected error while initiating update: " +
                              response.statusText
                          );
                      })
                      .catch((error) => updates.setError(error.message))
                  }
                >
                  {runningUpdate ? <Spinner size="xs" /> : "Update"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Modal.Body>
    </Modal>
  );
}
