import { useRef, useState } from "react";
import {
  Modal,
  Alert,
  Button,
  Label,
  Radio,
  TextInput,
  FileInput,
  Avatar,
  Tooltip,
} from "flowbite-react";
import { FiInfo, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

import { ApiUrl } from "../App";

export type ConfigurationProps = {
  open: boolean;
  onClose?: () => void;
};

export default function Configuration({ open, onClose }: ConfigurationProps) {
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [inputOk, setInputOk] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const addressOptions = [
    { address: "192.168.178.20", name: "local" },
    { address: "2.202.126.202", name: "global" },
  ];

  return (
    <Modal dismissible={true} show={open} size="xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-4">
          <h5 className="text-xl font-bold">User configuration</h5>
          <div className="space-y-1">
            <Label
              className="mb-1"
              htmlFor="username"
              value="Choose your displayed name"
            />
            <TextInput ref={usernameInputRef} id="username" type="text" />
          </div>
          <div className="flex flex-row place-content-between">
            <div className="space-y-1">
              <Label htmlFor="avatar" value="Choose your avatar" />
              <FileInput id="avatar" />
            </div>
            <Avatar rounded size="lg" />
          </div>
          <fieldset className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Label htmlFor="address" value="Choose your public address" />
              <Tooltip content="Other peers will be informed to respond to this address.">
                <FiInfo className="text-gray-500" />
              </Tooltip>
            </div>
            <legend id="address" className="mb-4"></legend>
            {addressOptions.map((value) => (
              <div key={value.name} className="flex items-center gap-2">
                <Radio id={value.name} name="address" value={value.address} />
                <Label htmlFor="spain">{value.name}</Label>
                <p className="text-sm text-gray-500">
                  ({value.address}, automatically detected)
                </p>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Radio id="custom" name="address" value="custom" defaultChecked />
              <TextInput sizing="sm" size={30}></TextInput>
            </div>
          </fieldset>
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
          <Button onClick={() => {}}>Apply</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
