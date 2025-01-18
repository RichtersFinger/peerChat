import { useRef, useState } from "react";
import { Modal, Alert, Button } from "flowbite-react";
import { FiInfo, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

import { ApiUrl, authKey, authKeyMaxAge } from "../App";
import PasswordInput from "../components/PasswordInput";

export type SetupProps = {
  open: boolean;
  onClose?: () => void;
};

export default function Setup({ open, onClose }: SetupProps) {
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [inputOk, setInputOk] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-6">
          <h5 className="text-xl font-bold">Setup</h5>
          <Alert color="info" icon={FiInfo}>
            Either enter a custom key or click the "Generate"-button to generate
            one automatically. After submission, this key can only be changed by
            manually resetting the server (please refer to the{" "}
            <a
              href="https://github.com/RichtersFinger/peerChat"
              className="font-bold"
            >
              documentation
            </a>{" "}
            for a guide).
          </Alert>
          <div>
            <PasswordInput
              ref={keyInputRef}
              onChange={() => {
                if (keyInputRef.current?.value) {
                  setInputOk(true);
                } else {
                  setInputOk(false);
                }
              }}
            />
          </div>
          {error ? (
            <Alert color="failure" icon={FiAlertCircle}>
              {error}
            </Alert>
          ) : null}
          {confirmation ? (
            <Alert color="success" icon={FiCheckCircle}>
              Key has been set.
            </Alert>
          ) : null}
          <div className="flex flex-row space-x-2">
            <Button
              onClick={() => {
                if (keyInputRef.current?.value !== undefined) {
                  keyInputRef.current.value = window.crypto.randomUUID();
                  setInputOk(true);
                }
              }}
            >
              Generate
            </Button>
            <Button
              disabled={!inputOk}
              onClick={() => {
                fetch(ApiUrl + "/auth/key", {
                  method: "POST",
                  body: JSON.stringify(
                    keyInputRef.current
                      ? { [authKey]: keyInputRef.current.value }
                      : {}
                  ),
                  headers: { "content-type": "application/json" },
                })
                  .then((response) => {
                    return { status: response.status, text: response.text() };
                  })
                  .then(async (data) => {
                    const text = await data.text;
                    if (data.status === 200) {
                      document.cookie =
                        authKey +
                        "=" +
                        text +
                        "; path=/; max-age=" +
                        authKeyMaxAge;
                      setError("");
                      setConfirmation(true);
                    } else setError("Failed to set key: " + text);
                  })
                  .catch((error) => {
                    console.error("Failed to set key: ", error);
                    setError("Failed to set key: " + error.message);
                  });
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
