import { useEffect, useReducer, useState, useRef, useContext } from "react";
import { Avatar, Button, Spinner, Textarea } from "flowbite-react";

import { SocketContext } from "../App";
import useConversation from "../hooks/useConversation";
import useUser from "../hooks/useUser";
import MessageLoader, { Message } from "./MessageLoader";
import MessageItem from "./MessageItem";

export type ConversationScreenProps = {
  cid: string;
};

const DEFAULT_NMESSAGES = 3;
const DEFAULT_NMESSAGES_INCREMENT = 5;

export default function ConversationScreen({
  cid,
}: ConversationScreenProps) {
  const socket = useContext(SocketContext);
  const conversation = useConversation(socket, cid);
  const user = useUser(conversation.peer);

  const [nMessages, setNMessages] = useState<number>(DEFAULT_NMESSAGES);
  const [messages, dispatchMessages] = useReducer(
    (state: Message[], action: Message | null) => {
      if (action) {
        const newState = [...state];
        newState[Number(action.id)] = action;
        return newState;
      } else return [];
    },
    []
  );
  const newMessageRef = useRef<HTMLTextAreaElement>(null);

  // configure socket
  useEffect(() => {
    if (socket) {
      socket.on(
        "update-message",
        ({ cid: _cid, message }: { cid: string; message: Message }) => {
          if (_cid === cid) dispatchMessages(message);
        }
      );
      return () => {
        socket.off("update-message");
      };
    }
  }, [socket, cid, dispatchMessages]);

  // reset initial values for states if cid changes
  useEffect(() => {
    dispatchMessages(null);
    setNMessages(DEFAULT_NMESSAGES);
  }, [cid]);

  if (!socket) return null;
  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden">
      {
        // header
      }
      <div className="flex flex-row space-x-2 bg-slate-50 p-2">
        <Avatar
          {...(user.avatar ? { img: user.avatar } : {})}
          rounded
          size="lg"
        />
        <div className="flex-col space-y-1 font-medium">
          <p className="truncate">{conversation.name ?? conversation.id}</p>
          {user.name ? (
            <p className="truncate text-sm text-gray-500">
              {user.name}
            </p>
          ) : null}
          {conversation.peer ? (
            <p className="truncate text-sm text-gray-500">
              {conversation.peer}
            </p>
          ) : null}
        </div>
      </div>
      {
        // body
      }
      <div className="m-4 space-y-3 overflow-y-auto h-full">
        <div className="justify-items-center">
          {messages.length > 0 && nMessages < (conversation.length ?? 0) ? (
            <div className="flex flex-row space-x-2">
              <Button
                onClick={() =>
                  setNMessages((previous: number) =>
                    Math.min(
                      conversation.length ?? 0,
                      previous + DEFAULT_NMESSAGES_INCREMENT
                    )
                  )
                }
              >
                Load more
              </Button>
              <Button onClick={() => setNMessages(conversation.length ?? 0)}>
                Load all
              </Button>
            </div>
          ) : null}
        </div>
        {Array(Math.min(conversation.length ?? 0, nMessages))
          .fill(0)
          .map((_, index) => (conversation.length ?? 0) - 1 - index)
          .map((mid: number) => (
            <MessageLoader
              key={mid}
              cid={conversation.id}
              mid={mid.toString()}
              onLoad={dispatchMessages}
            />
          ))}
        {messages.length > 0 ? (
          <div className="space-y-3">
            {messages
              .slice(
                (conversation.length ?? 0) -
                  Math.min(conversation.length ?? 0, nMessages)
              )
              .map((m: Message, index: number) => (
                <MessageItem
                  key={m?.id ?? "?" + index.toString()}
                  message={m}
                />
              ))}
          </div>
        ) : (
          <div className="justify-items-center">
            <Spinner size="xl" />
          </div>
        )}
      </div>
      <div className="flex flex-row space-x-2 p-4">
        <Textarea ref={newMessageRef} placeholder="Your message..." rows={3} />
        <div>
          <Button
            onClick={() => {
              socket.emit(
                "post-message",
                conversation.id,
                { body: newMessageRef.current?.value, isMine: true },
                (mid: number) => {
                  if (newMessageRef.current?.value)
                    newMessageRef.current.value = "";
                  socket.emit("send-message", cid, mid.toString());
                }
              );
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
