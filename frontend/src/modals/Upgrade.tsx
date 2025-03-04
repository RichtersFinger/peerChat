import { Modal, Spinner, Alert, Button } from "flowbite-react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

import useStore from "../stores";
import { ApiUrl } from "../App";

type UpgradeProps = {
  open: boolean;
  onClose?: () => void;
};

export default function Upgrade({ open, onClose }: UpgradeProps) {
  const updates = useStore((state) => state.updates);

  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="flex flex-row justify-between">
          <h5 className="text-xl font-bold">Upgrade</h5>
          <Button
            disabled={updates.info === undefined}
            className="aspect-square items-center"
            size="xs"
            onClick={() => {
              updates.setInfo();
              updates.fetchInfo(ApiUrl, false);
            }}
          >
            <FiRefreshCw size={15} />
          </Button>
        </div>
        <div className="space-y-6">
          {updates.error ? (
            <Alert color="failure" icon={FiAlertCircle}>
              {updates.error}
            </Alert>
          ) : null}
          {!updates.info && !updates.error ? (
            <div className="flex w-full justify-center">
              <Spinner size="xl" />
            </div>
          ) : null}
          {updates.info ? (
            <>
              <div className="flex flex-col space-y-2 pt-4">
                <div className="flex flex-row justify-between">
                  <span>{"Current version: " + updates.info.current}</span>
                  {updates.info.latest ? (
                    <span>{"Latest version: " + updates.info.latest}</span>
                  ) : null}
                </div>
                {updates.info.changelog ? (
                  <textarea
                    className="bg-gray-100 h-64 rounded-xl font-mono resize-none overflow-y-auto hide-scrollbar hover:show-scrollbar"
                    disabled={true}
                    value={updates.info.changelog}
                  />
                ) : null}
              </div>
              <div className="flex flex-row space-x-5">
                <Button
                  color="failure"
                  disabled={!updates.info?.upgrade || updates.info?.declined}
                  onClick={() =>
                    fetch(ApiUrl + "/update/decline", {
                      method: "PUT",
                      credentials: "include",
                    })
                      .then((response) => {
                        if (response.ok) {
                          updates.setInfo();
                          updates.fetchInfo(ApiUrl, false);
                          onClose?.();
                        }
                      })
                      .catch((error) => updates.setError(error.message))
                  }
                >
                  Decline
                </Button>
                <Button color="success" disabled={!updates.info?.upgrade}>
                  Update
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Modal.Body>
    </Modal>
  );
}
