import { Spinner } from "flowbite-react";

export type Message = {
  id: string;
  body: string | null;
  status: "ok" | "queued" | "sending" | "draft" | "deleted" | "error";
  isMine: boolean;
  lastModified: string;
};

export type ChatMessageItemProps = {
  message: Message;
};

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
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
