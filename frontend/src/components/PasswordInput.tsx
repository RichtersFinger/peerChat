import { useState, forwardRef } from "react";
import { Label, TextInput } from "flowbite-react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export type PasswordInputProps = {
  id?: string;
  className?: string;
  classNameInner?: string;
  onChange?: () => void;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function (props, ref) {
    const [keyInputType, setKeyInputType] = useState<string>("password");
    return (
      <>
        <div className="mb-2 block">
          <Label htmlFor={props.id} value="Your key" />
        </div>
        <div className={props.className ?? "relative w-full h-10"}>
          <TextInput
            ref={ref}
            className={props.classNameInner ?? "absolute left-0 top-0 w-full"}
            id={props.id}
            type={keyInputType}
            required
            onChange={props.onChange}
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
      </>
    );
  }
);

export default PasswordInput;
