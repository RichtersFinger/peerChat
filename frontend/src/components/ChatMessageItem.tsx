import { useContext } from "react";
import { Tooltip, Spinner, Alert, Button } from "flowbite-react";

import { SocketContext } from "../App";

export type Message = {
  id: number;
  body: string | null;
  status: "ok" | "sending" | "draft" | "queued" | "deleted" | "error";
  isMine: boolean;
  lastModified: string;
};

export type ChatMessageItemProps = {
  cid: string;
  message: Message;
};

export default function ChatMessageItem({
  cid,
  message,
}: ChatMessageItemProps) {
  const socket = useContext(SocketContext);

  /**
   * Returns re-formatted ISO-datetime
   * @param date ISO-datetime
   * @returns formatted datetime
   */
  function formatDate(date: string): string {
    const _date = new Date(message.lastModified);
    const today = new Date();

    return (
      (new Date(_date).setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)
        ? "today"
        : _date.toDateString()) +
      ", " +
      String(_date.getHours()).padStart(2, "0") +
      ":" +
      String(_date.getMinutes()).padStart(2, "0") +
      ":" +
      String(_date.getSeconds()).padStart(2, "0")
    );
  }

  return (
    <div
      className={
        "rounded-md px-4 py-2 drop-shadow-md " +
        (message?.isMine ? "bg-slate-200 ms-20" : "bg-green-100 me-20")
      }
    >
      {message ? (
        <div className="space-y-2">
          <p className={message?.isMine ? "text-end" : "text-start"}>
            {message.body}
          </p>
          <div className="flex flex-row place-content-between items-end">
            {message.status === "sending" ? (
              <Tooltip content="sending">
                <Spinner size="xs" />
              </Tooltip>
            ) : (
              <div />
            )}
            <p className="text-end text-xs text-gray-500">
              {formatDate(message.lastModified)}
            </p>
          </div>
          {message.status === "queued" ? (
            <Alert color="light">
              <div className="space-y-2">
                <p>
                  This message is currently queued and will be sent
                  automatically when peer is available.
                </p>
                <div className="flex flex-row space-x-2 justify-end">
                  <Button
                    outline
                    color="failure"
                    size="xs"
                    onClick={() =>
                      socket?.emit("delete-message", cid, message.id)
                    }
                  >
                    Delete
                  </Button>
                  <Button
                    outline
                    color="info"
                    size="xs"
                    onClick={() =>
                      socket?.emit("send-message", cid, message.id)
                    }
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </Alert>
          ) : null}
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
