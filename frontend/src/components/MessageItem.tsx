import { Spinner } from "flowbite-react";

import { Message } from "./MessageLoader";

export type MessageItemProps = {
  message?: Message;
};

export default function MessageItem({
  message,
}: MessageItemProps) {
  return <div>{message ? message.body: <Spinner />}</div>;
}
