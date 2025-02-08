import {
  Modal,
} from "flowbite-react";


export type NewConversationProps = {
  open: boolean;
  onClose?: () => void;
};

export default function NewConversation({ open, onClose }: NewConversationProps) {
  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        -
      </Modal.Body>
    </Modal>
  );
}
