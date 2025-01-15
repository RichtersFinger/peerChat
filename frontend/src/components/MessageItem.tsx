import { useContext } from "react";
import { Spinner } from "flowbite-react";

import { SocketContext } from "../App";
import useMessage from "../hooks/useMessage";

export type MessageItemProps = {
  cid: string;
  mid: string;
};

export default function MessageItem({ cid, mid }: MessageItemProps) {
  const socket = useContext(SocketContext);
  const message = useMessage(socket, cid, mid);

  return (
    <div
      className={
        "rounded-md px-4 py-2 " +
        (message?.isMine ? "bg-slate-200 ms-10" : "bg-green-100 me-10")
      }
    >
      {message ? (
        <div className="space-y-2">
          <p className={message?.isMine ? "text-end" : "text-start"}>
            {message.body}
          </p>
          <p className="text-end text-xs text-gray-500">
            {message.status !== "ok" ? message.status + " • " : ""}
            {message.lastModified}
          </p>
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
