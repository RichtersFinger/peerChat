import { useEffect } from "react";

import useUserName from "./useUserName";
import useUserAvatar from "./useUserAvatar";

export type User = {
  name: string | null;
  avatar: string | null;
};

export default function useUser(url?: string, onLoad?: (u: User) => void): User {
  const userName = useUserName(url);
  const userAvatar = useUserAvatar(url);

  // call onLoad after completion
  useEffect(() => {
    if (onLoad) onLoad({ name: userName, avatar: userAvatar });
  }, [userName, userAvatar, onLoad]);

  return { name: userName, avatar: userAvatar };
}
