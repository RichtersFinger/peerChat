import { Modal, Label, TextInput, Avatar, Button } from "flowbite-react";

export type NewConversationProps = {
  open: boolean;
  onClose?: () => void;
};

export default function NewConversation({
  open,
  onClose,
}: NewConversationProps) {
  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
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
              defaultValue="New Conversation"
              onFocus={(e) => {
                e.target.select();
              }}
              onChange={(e) => {
                //setTitle(e.target.value);
              }}
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
                  //setPeer(e.target.value);
                }}
              />
              <div className="flex flex-row space-x-2 place-items-center">
                <p className="max-w-128 truncate text-sm text-gray-500">
                  peer name
                </p>
                <Avatar rounded size="md" />
              </div>
            </div>
          </div>
          <Button>Apply</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
