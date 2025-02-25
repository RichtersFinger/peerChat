import { Modal, Button } from "flowbite-react";

export type ConfirmationProps = {
  open: boolean;
  title: string;
  text: string;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function Confirmation({
  open,
  title,
  text,
  onClose,
  onConfirm,
  onCancel,
}: ConfirmationProps) {
  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-6">
          <h5 className="text-xl font-bold">{title}</h5>
          <p>{text}</p>
          <div className="flex flex-row space-x-2">
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={onConfirm}>Confirm</Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
