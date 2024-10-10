import * as Vaul from "vaul";
import * as React from "react";

export function Drawer(props: {
  children?: React.ReactNode;
  isWide: boolean;
  snap: number;
  setSnap: (snap: number) => void;
  snapPoints: Array<number>;
  drawerHeight: number;
}) {
  const isModal = props.snap === props.snapPoints.at(-1);

  return (
    <Vaul.Drawer.Root
      activeSnapPoint={props.snap}
      setActiveSnapPoint={(p) =>
        p != null && typeof p == "number" ? props.setSnap(p) : void 0
      }
      snapPoints={props.snapPoints}
      // snapToSequentialPoint
      defaultOpen
      // onClose={() => {
      //   const currentSnapIx = snapPoints.indexOf(snap);
      //   setSnap(snapPoints.at(Math.max(0, currentSnapIx - 1))!);
      // }}
      open
      direction={props.isWide ? "right" : "bottom"}
      fadeFromIndex={2}
      dismissible={false}
      // defaultOpen
      modal={isModal}
    >
      {/* <div className="fixed inset-0 flex h-20 items-end"> */}
      {/* <Drawer.Trigger className="w-full h-20 p-2 bg-white">
        Open Drawer (isWide: {isWide ? "true" : "false"})
      </Drawer.Trigger> */}
      {/* </div> */}
      {/* <Vaul.Drawer.Portal> */}
      <Vaul.Drawer.Overlay
        className="fixed inset-0 bg-black/40"
        // ref={ref}
      />
      <Vaul.Drawer.Content
        className="bg-white pt-2 grid gap-2 rounded-t-xl outline outline-4 outline-neutral-500/10 overflow-hidden"
        // className={[
        //   `bg-white p-2 fixed bottom-0 right-0 outline-none`,
        //   isWide ? "top-0 h-full" : "left-0 h-fit",
        // ].join(" ")}
      >
        <Vaul.Drawer.Handle />
        <div className="flex flex-col h-dvh">
          <div
            className="overflow-y-auto h-full max-h-[var(--height)] overscroll-y-contain"
            style={{
              "--height": `calc(${props.drawerHeight}px - 1.25rem)`,
            }}
          >
            {props.children}
          </div>
        </div>
      </Vaul.Drawer.Content>
      {/* </Vaul.Drawer.Portal> */}
    </Vaul.Drawer.Root>
  );
}
