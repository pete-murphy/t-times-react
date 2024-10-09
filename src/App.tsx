import { useCurrentPosition, usePredictions, useTravelTimes } from "./data";
import { Drawer } from "./Drawer";
import { MapView } from "./MapView";
import * as React from "react";
import { TimesList } from "./TimesList";

export function App() {
  const currentPosition = useCurrentPosition();
  const predictionsResponse = usePredictions(currentPosition?.coords ?? null);
  const travelTimes = useTravelTimes(
    currentPosition?.coords ?? null,
    predictionsResponse
  );

  if (!predictionsResponse) {
    return <main>Loading...</main>;
  }
  if (!currentPosition) {
    return <main>Loading...</main>;
  }

  return (
    <main className="h-dvh flex flex-col">
      <MapView
        currentCoordinates={currentPosition.coords}
        style={{
          position: "absolute",
          inset: 0,
          height: "100%",
          gridArea: "1/-1",
          // height: "100dvh",
          // maxHeight: "100dvh",
          font: "inherit",
          fontSize: "0.75rem",
        }}
        vehicles={[]}
        stops={Array.from(predictionsResponse.included.stops.entries()).map(
          ([stopId, stop]) => ({
            id: stopId,
            coordinates: {
              latitude: stop.attributes.latitude,
              longitude: stop.attributes.longitude,
            },
            node: (
              <div className="bg-white p-1 rounded-md">
                {stop.attributes.name}
              </div>
            ),
          })
        )}
      />
      <Drawer>
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
