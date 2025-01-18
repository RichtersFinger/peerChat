import { useRef, useState } from "react";
import { Modal, Alert, Label, TextInput, Button } from "flowbite-react";
import { FiInfo, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from "react-icons/fi";

import { ApiUrl, authKey, authKeyMaxAge } from "../App";

export type SetupProps = {
  open: boolean;
  onClose?: () => void;
};

export default function Setup({ open, onClose }: SetupProps) {
  const keyInput = useRef<HTMLInputElement>(null);
  const [keyInputType, setKeyInputType] = useState<string>("password");
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
            <div className="mb-2 block">
              <Label htmlFor="password" value="Your key" />
            </div>
            <div className="relative w-full h-10">
              <TextInput
                ref={keyInput}
                className="absolute left-0 top-0 w-full"
                id="password"
                type={keyInputType}
                required
                onChange={() => {
                  if (keyInput.current?.value) {
                    setInputOk(true);
                  } else {
                    setInputOk(false);
                  }
                }}
              />
              {keyInputType === "password" ? (
                <FiEye
                  className="absolute right-2 top-3 text-gray-500 hover:text-black"
                  onClick={() => setKeyInputType("text")}
                />
              ) : (
                <FiEyeOff
                  className="absolute right-2 top-3 text-gray-500 hover:text-black"
                  onClick={() => setKeyInputType("password")}
                />
              )}
            </div>
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
                if (keyInput.current?.value !== undefined){
                  keyInput.current.value = window.crypto.randomUUID();
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
                    keyInput.current
                      ? { [authKey]: keyInput.current.value }
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
                    } else
                      setError("Failed to set key: " + text);
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
