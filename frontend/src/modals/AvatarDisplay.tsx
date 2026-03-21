import { Modal, ModalBody, ModalHeader, Spinner } from "flowbite-react";

import useStore from "../stores";

export type AvatarDisplayProps = {
  open: boolean;
  peer?: string;
  onClose?: () => void;
};

export default function AvatarDisplay({
  open,
  peer,
  onClose,
}: AvatarDisplayProps) {
  const peerInfo = useStore((state) => state.peers.data[peer ?? ""]);

  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <ModalHeader>
        <h5 className="text-xl font-bold">{peerInfo?.name}'s avatar</h5>
      </ModalHeader>
      <ModalBody>
        {peer && peerInfo?.avatar ? (
          <img alt={peer} src={peerInfo.avatar}></img>
        ) : (
          <Spinner />
        )}
      </ModalBody>
    </Modal>
  );
}
