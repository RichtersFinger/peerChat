import { useState } from "react";
import { Modal, Label, TextInput, Avatar, Button } from "flowbite-react";

import useUser from "../hooks/useUser";

export type NewConversationProps = {
  open: boolean;
  onClose?: () => void;
};

export default function NewConversation({
  open,
  onClose,
}: NewConversationProps) {
  const [title, setTitle] = useState("New Conversation");
  const [peerAddress, setPeerAddress] = useState<string | null>(null);
  const peer = useUser(peerAddress ?? undefined);

  return (
    <Modal
      dismissible={true}
      show={open}
      size="xl"
      onClose={() => {
        onClose?.();
        setPeerAddress(null);
      }}
      popup
    >
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-4">
          <h5 className="text-xl font-bold">New Conversation</h5>
          <div className="space-y-1">
            <Label
              className="mb-1"
              htmlFor="title"
              value="Conversation title"
            />
            <TextInput
              id="title"
              type="text"
              defaultValue={title}
              onFocus={(e) => {
                e.target.select();
              }}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              required
              color={title ? undefined: "failure"}
            />
          </div>
          <div className="space-y-1">
            <Label className="mb-1" htmlFor="peer" value="Peer address" />
            <div className="flex flex-row grid-cols-2 place-content-between">
              <TextInput
                id="peer"
                type="text"
                onFocus={(e) => {
                  e.target.select();
                }}
                onChange={(e) => {
                  setPeerAddress(e.target.value);
                }}
                required
                color={peerAddress ? undefined: "failure"}
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
          <Button disabled={!peerAddress || !title}>Apply</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
