import * as React from "react";
import { FaX, FaCheck, FaCopy } from "react-icons/fa6";

export function CopyToClipboard(props: { text: string }) {
  type CopyState =
    | { type: "initial" }
    | { type: "success" }
    | { type: "error"; error: Error };
  const [copying, setCopying] = React.useState<CopyState>({
    type: "initial",
  });

  function handleCopy() {
    navigator.clipboard
      .writeText(props.text)
      .then(
        () => setCopying({ type: "success" }),
        (error) => setCopying({ type: "error", error })
      )
      .then(() => {
        setTimeout(() => {
          setCopying({ type: "initial" });
        }, 3000);
      });
  }

  const inner =
    copying.type === "success" ? (
      <FaCheck />
    ) : copying.type === "error" ? (
      <FaX />
    ) : (
      <FaCopy />
    );

  return (
    <button onClick={handleCopy} className="font-bold flex gap-2 items-center">
      {inner}
    </button>
  );
}
