import { useState, useEffect } from "react";

export type User = {
  name: string | null;
  avatar: string | null;
};

export type UserLoaderProps = {
  url: string;
  onLoad?: (u: User) => void;
};

export default function UserLoader({ url, onLoad }: UserLoaderProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // load user-avatar
  useEffect(() => {
    fetch(url + "/api/v0/user/avatar")
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP-Error", { cause: response });
        } else {
          return response.blob();
        }
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && typeof reader.result === "string") {
            setUserAvatar(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        console.error("Failed to fetch resource: ", error);
      });;
  }, [url, setUserAvatar]);

  // load user-name
  useEffect(() => {
    fetch(url + "/api/v0/user/name")
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP-Error", { cause: response });
        } else {
          return response.text();
        }
      })
      .then((text) => {
        setUserName(text);
      })
      .catch((error) => {
        console.error("Failed to fetch resource: ", error);
      });
  }, [url, setUserName]);

  // call onLoad after completion
  useEffect(() => {
    if (onLoad)
      onLoad({ name: userName, avatar: userAvatar });
  }, [userName, userAvatar, onLoad]);

  return null;
}
