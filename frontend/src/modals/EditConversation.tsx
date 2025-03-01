import { useState, useContext } from "react";
import { Modal, Label, TextInput, Avatar, Button, Alert } from "flowbite-react";
import { FiAlertCircle } from "react-icons/fi";

import { SocketContext } from "../App";
import { Conversation } from "../stores";
import useUser from "../hooks/useUser";

export type EditConversationProps = {
  open: boolean;
  conversation: Conversation;
  onClose?: () => void;
};

export default function EditConversation({
  open,
  conversation,
  onClose,
}: EditConversationProps) {
  const socket = useContext(SocketContext);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(conversation.name);
  const [peerAddress, setPeerAddress] = useState(conversation.peer);
  const peer = useUser(peerAddress);

  return (
    <Modal
      dismissible={true}
      show={open}
      size="xl"
      onClose={() => {
        onClose?.();
      }}
      popup
    >
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-4">
          <h5 className="text-xl font-bold">{`Edit Conversation '${conversation.name}'`}</h5>
          <div className="space-y-1">
            <Label
              className="mb-1"
              htmlFor="title"
              value="Conversation title"
            />
            <TextInput
              id="title"
              type="text"
              defaultValue={title ?? ""}
              onFocus={(e) => {
                e.target.select();
              }}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              color={title ? undefined : "failure"}
            />
          </div>
          <div className="space-y-1">
            <Label className="mb-1" htmlFor="peer" value="Peer address" />
            <div className="flex flex-row grid-cols-2 place-content-between">
              <TextInput
                id="peer"
                type="text"
                defaultValue={peerAddress}
                onFocus={(e) => {
                  e.target.select();
                }}
                onChange={(e) => {
                  setPeerAddress(e.target.value);
                }}
                color={peerAddress ? undefined : "failure"}
              />
              <div className="flex flex-row space-x-2 place-items-center">
                <p className="max-w-128 truncate text-sm text-gray-500">
                  {peer.name ?? null}
                </p>
                <Avatar
                  {...(peer.avatar ? { img: peer.avatar } : {})}
                  rounded
                  status={peer.name ? "online" : "offline"}
                  size="md"
                />
              </div>
            </div>
          </div>
          {error ? (
            <Alert color="failure" icon={FiAlertCircle}>
              {error}
            </Alert>
          ) : null}
          <Button
            disabled={!socket || !peerAddress || !title}
            onClick={() => {
              socket?.emit(
                "change-conversation-details",
                conversation.id,
                title,
                peerAddress,
                (ok: boolean) => {
                  if (ok) onClose?.();
                  else setError("Some error occurred.");
                }
              );
            }}
          >
            Apply
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
