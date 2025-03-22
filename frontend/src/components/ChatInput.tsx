import { useRef, useContext } from "react";
import { Button, Textarea } from "flowbite-react";

import { SocketContext } from "../App";

/**
 * Returns true if the given url-string is a valid url.
 */
function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export type ChatInputProps = {
  cid: string;
};

export default function ChatInput({ cid }: ChatInputProps) {
  const socket = useContext(SocketContext);
  const newMessageRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Attempts to send current input as message. Skip if socket is undefined.
   */
  function sendMessage() {
    if (!socket) return;

    socket.emit(
      "post-message",
      cid,
      { body: newMessageRef.current?.value, isMine: true },
      (mid: number) => {
        if (newMessageRef.current?.value) newMessageRef.current.value = "";
        socket.emit("send-message", cid, mid);
      }
    );
  }

  return (
    <div className="flex flex-row space-x-2 p-4">
      <Textarea
        className="text-lg"
        ref={newMessageRef}
        placeholder="Your message..."
        rows={4}
        onPaste={(e) => {
          if (
            newMessageRef.current &&
            newMessageRef.current?.selectionStart <
              newMessageRef.current?.selectionEnd &&
            isUrl(e.clipboardData.getData("text"))
          ) {
            e.preventDefault();
            const mdLink =
              "[" +
              newMessageRef.current.value.slice(
                newMessageRef.current.selectionStart,
                newMessageRef.current.selectionEnd
              ) +
              "](" +
              e.clipboardData.getData("text") +
              ")";
            const postInsertCursorPosition =
              newMessageRef.current.selectionStart + mdLink.length;

            newMessageRef.current.value =
              newMessageRef.current.value.slice(
                0,
                newMessageRef.current.selectionStart
              ) +
              mdLink +
              newMessageRef.current.value.slice(
                newMessageRef.current.selectionEnd,
                newMessageRef.current.value.length
              );
            newMessageRef.current.selectionStart = postInsertCursorPosition;
            newMessageRef.current.selectionEnd = postInsertCursorPosition;
          }
        }}
        onKeyDown={(e) => {
          if (!e.shiftKey && e.key === "Enter") sendMessage();
        }}
      />
      <div>
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
