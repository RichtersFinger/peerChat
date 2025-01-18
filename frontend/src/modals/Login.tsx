import { useRef, useState } from "react";
import { Modal, Alert, Button } from "flowbite-react";
import { FiAlertCircle} from "react-icons/fi";

import { ApiUrl, authKey, authKeyMaxAge } from "../App";
import PasswordInput from "../components/PasswordInput";

export type LoginProps = {
  open: boolean;
  onClose?: () => void;
  onLogin?: () => void;
};

export default function Login({ open, onClose, onLogin }: LoginProps) {
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [inputOk, setInputOk] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-6">
          <h5 className="text-xl font-bold">Login</h5>
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
          <div className="flex flex-row space-x-2">
            <Button
              disabled={!inputOk}
              onClick={() => {
                document.cookie =
                  authKey +
                  "=" +
                  keyInputRef.current?.value +
                  "; path=/; max-age=" +
                  authKeyMaxAge;
                fetch(
                  ApiUrl + "/auth/test",
                  process.env.REACT_APP_API_BASE_URL
                    ? { credentials: "include" }
                    : {}
                ).then(async (response) => {
                  if (onLogin && response.ok) onLogin();
                  if (response.ok) setError("");
                  else setError("Login failed: " + (await response.text()));
                });
              }}
            >
              Login
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
