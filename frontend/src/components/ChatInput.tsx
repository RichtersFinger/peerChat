import { useRef, useContext, useState } from "react";
import { Button, Textarea } from "flowbite-react";

import { SocketContext } from "../App";
import Markdown from "./Markdown";

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
  const [preview, setPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

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
        setPreviewContent("");
        setPreview(false);
        socket.emit("send-message", cid, mid);
      }
    );
  }

  return (
    <div className="flex flex-col space-y-2 px-4 pb-2">
      <div className="flex flex-row space-x-2">
        <Button
          color="gray"
          size="xs"
          onClick={() => {
            setPreviewContent(newMessageRef.current?.value ?? "");
            setPreview((state) => !state);
          }}
        >
          {preview ? "Continue writing" : "Preview"}
        </Button>
      </div>
      <div className="flex flex-row space-x-2">
        {preview && (
          <div className="border-2 border-gray-200 rounded-lg grow h-32 px-4 py-1 overflow-y-auto hide-scrollbar hover:show-scrollbar">
            <Markdown>{previewContent}</Markdown>
          </div>
        )}
        <Textarea
          className={"text-lg hide-scrollbar hover:show-scrollbar " + (preview ? "hidden" : "visible")}
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
    </div>
  );
}
