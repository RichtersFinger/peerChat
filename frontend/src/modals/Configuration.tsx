import { useState } from "react";
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
import { FiInfo, FiAlertCircle } from "react-icons/fi";

import { ApiUrl } from "../App";
import useUser from "../hooks/useUser";

export type ConfigurationProps = {
  open: boolean;
  onClose?: () => void;
};

export default function Configuration({ open, onClose }: ConfigurationProps) {
  const user = useUser(ApiUrl);
  const [newUserName, setNewUserName] = useState<string | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [userNameError, setUserNameError] = useState<string>("");
  const [userAvatarError, setUserAvatarError] = useState<string>("");

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
            <TextInput
              id="username"
              type="text"
              defaultValue={user.name ?? ""}
              onChange={(e) => {
                setNewUserName(e.target.value);
              }}
            />
          </div>
          {userNameError ? (
            <Alert color="failure" icon={FiAlertCircle}>
              {userNameError}
            </Alert>
          ) : null}
          <div className="flex flex-row place-content-between">
            <div className="space-y-1">
              <Label htmlFor="avatar" value="Choose your avatar" />
              <FileInput
                id="avatar"
                onChange={async (e) => {
                  const reader = new FileReader();
                  reader.addEventListener(
                    "load",
                    () => {
                      if (typeof reader.result === "string")
                        setNewAvatarPreview(reader.result);
                    },
                    false
                  );
                  if (e.target.files?.[0]) {
                    reader.readAsDataURL(e.target.files?.[0]);
                  }
                }}
              />
            </div>
            <Avatar
              rounded
              size="lg"
              {...(newAvatarPreview
                ? { img: newAvatarPreview }
                : user?.avatar
                ? { img: user.avatar }
                : {})}
            />
          </div>
          {userAvatarError ? (
            <Alert color="failure" icon={FiAlertCircle}>
              {userAvatarError}
            </Alert>
          ) : null}
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
        </div>
        <Button
          disabled={user.name === newUserName && newAvatarPreview === null}
          onClick={async () => {
            if (user.name !== newUserName) {
              await fetch(ApiUrl + "/user/name", {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "text/plain",
                },
                body: newUserName,
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error("HTTP-Error", { cause: response });
                  } else {
                    return response.text();
                  }
                })
                .catch((error) => {
                  setUserNameError(error.toString());
                  console.error("Failed to post: ", error);
                });
            }
            if (newAvatarPreview) {
              await fetch(ApiUrl + "/user/avatar", {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "text/plain",
                },
                body: newAvatarPreview,
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error("HTTP-Error", { cause: response });
                  } else {
                    return response.text();
                  }
                })
                .catch((error) => {
                  setUserAvatarError(error.toString());
                  console.error("Failed to post: ", error);
                });
            }
            if (onClose) {
              onClose();
              window.location.reload();
            }
          }}
        >
          Apply
        </Button>
      </Modal.Body>
    </Modal>
  );
}
