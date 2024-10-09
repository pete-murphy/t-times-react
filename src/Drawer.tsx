import * as Vaul from "vaul";
import * as React from "react";
import * as ReactUse from "react-use";

// const snapPoints = ["50px", "75px", "100px"];
const snapPoints = ["148px", 0.4, 0.95];

export function Drawer(props: { children?: React.ReactNode }) {
  // const isWide = ReactUse.useMedia("(min-width: 640px)");
  const isWide = false; // TODO

  const [snap, setSnap] = React.useState<number | string>(snapPoints.at(1)!);

  // TODO: Don't rely on window size
  const windowSize = ReactUse.useWindowSize();
  const drawerHeight = React.useMemo(
    () => (typeof snap === "string" ? snap : windowSize.height * snap + "px"),
    [snap, windowSize.height]
  );
  console.log("drawerHeight", drawerHeight);

  return (
    <Vaul.Drawer.Root
      activeSnapPoint={snap}
      setActiveSnapPoint={(p) => (p != null ? setSnap(p) : void 0)}
      snapPoints={snapPoints}
      snapToSequentialPoint
      defaultOpen
      // onClose={() => {
      //   const currentSnapIx = snapPoints.indexOf(snap);
      //   setSnap(snapPoints.at(Math.max(0, currentSnapIx - 1))!);
      // }}
      open
      direction={isWide ? "right" : "bottom"}
      fadeFromIndex={2}
      dismissible={false}
      // defaultOpen
      modal={false}
    >
      {/* <div className="fixed inset-0 flex h-20 items-end"> */}
      {/* <Drawer.Trigger className="w-full h-20 p-2 bg-white">
        Open Drawer (isWide: {isWide ? "true" : "false"})
      </Drawer.Trigger> */}
      {/* </div> */}
      {/* <Drawer.Portal> */}
      <Vaul.Drawer.Overlay
        className="fixed inset-0 bg-black/40"
        // ref={ref}
      />
      <Vaul.Drawer.Content
        className="bg-white pt-2 h-fit grid gap-2 rounded-t-xl outline outline-2 outline-neutral-500/10 overflow-hidden"
        // className={[
        //   `bg-white p-2 fixed bottom-0 right-0 outline-none`,
        //   isWide ? "top-0 h-full" : "left-0 h-fit",
        // ].join(" ")}
      >
        <Vaul.Drawer.Handle />
        <div
          className="overflow-y-auto h-full max-h-[var(--height)] overscroll-y-contain"
          style={{
            "--height": `calc(${drawerHeight} - 1.25rem)`,
          }}
        >
          {props.children}
        </div>
      </Vaul.Drawer.Content>
      {/* </Vaul.Drawer.Portal> */}
    </Vaul.Drawer.Root>
  );
}
