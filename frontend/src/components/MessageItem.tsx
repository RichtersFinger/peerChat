import { Spinner } from "flowbite-react";

import { Message } from "./MessageLoader";

export type MessageItemProps = {
  message?: Message;
};

export default function MessageItem({ message }: MessageItemProps) {
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
            {message.lastModified}
          </p>
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
