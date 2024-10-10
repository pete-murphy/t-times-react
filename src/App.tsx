import * as React from "react";
import * as ReactUse from "react-use";

import { useCurrentPosition, usePredictions, useTravelTimes } from "./data";
import { Drawer } from "./Drawer";
import { MapView } from "./MapView";
import { TimesList } from "./TimesList";

const snapPoints = [0.15, 0.5, 0.95];

export function App() {
  const currentPosition = useCurrentPosition({
    override: {
      latitude: 42.3551,
      longitude: -71.0656,
    },
  });
  const predictionsResponse = usePredictions(currentPosition?.coords ?? null);
  const travelTimes = useTravelTimes(
    currentPosition?.coords ?? null,
    predictionsResponse
  );

  // const isWide = ReactUse.useMedia("(min-width: 640px)");
  const isWide = false; // TODOn't

  // TODOn't: rely on window size
  const windowSize = ReactUse.useWindowSize();

  const [snap, setSnap] = React.useState<number>(snapPoints.at(1)!);

  if (!predictionsResponse) {
    return <main>Loading...</main>;
  }
  if (!currentPosition) {
    return <main>Loading...</main>;
  }

  return (
    <main className="h-dvh flex flex-col">
      <MapView
        padding={{
          bottom: Math.min(snap, snapPoints.at(1)!) * windowSize.height,
        }}
        currentCoordinates={currentPosition.coords}
        style={{
          position: "absolute",
          inset: 0,
          height: "100%",
          // gridArea: "1/-1",
          font: "inherit",
          fontSize: "0.75rem",
        }}
        markerData={Array.from(predictionsResponse.included.stops.entries())
          .map(([stopId, stop]) => {
            return {
              id: stopId,
              coordinates: {
                latitude: stop.attributes.latitude,
                longitude: stop.attributes.longitude,
              },
              node: (
                <div
                  className="bg-white/50 outline outline-[var(--outline-color)] outline-2 rounded-full size-2"
                  style={{
                    outlineColor: "#999",
                  }}
                />
              ),
            };
          })
          .concat([
            {
              id: "me",
              coordinates: currentPosition.coords,
              node: (
                <div className="grid [&>*]:[grid-area:1/-1] place-items-center">
                  <div className="bg-white rounded-full size-5 shadow-md" />
                  <div className="bg-blue-500 animate-in-out o rounded-full size-4" />
                </div>
              ),
            },
          ])}
      />
      <Drawer
        drawerHeight={windowSize.height * snap}
        isWide={isWide}
        setSnap={setSnap}
        snap={snap}
        snapPoints={snapPoints}
      >
        <TimesList
          predictionsResponse={predictionsResponse}
          travelTimes={travelTimes}
          currentPosition={currentPosition}
        />
      </Drawer>
    </main>
  );
}

function Header() {
  return (
    <header className="p-2">
      <h1 className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlSpace="preserve"
          viewBox="0 0 1000 1000"
          className="inline-block w-8 h-8 mr-2"
        >
          <title>T</title>
          <path d="M500 0C223.9 0 0 223.9 0 500s223.9 500 500 500 500-223.9 500-500S776.1 0 500 0zm0 955.7c-251.7 0-455.7-204-455.7-455.7S248.3 44.3 500 44.3s455.7 204 455.7 455.7-204 455.7-455.7 455.7z"></path>
          <path d="M184.3 435.1h236.6v389.3h158.2V435.1h236.6V276.9H184.3z"></path>
        </svg>
        <span className="text-xl font-bold text-center text-gray-900">
          Times
        </span>
      </h1>
    </header>
  );
}
