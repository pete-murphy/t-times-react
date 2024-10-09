import React from "react";
import "@github/relative-time-element";
// import { CopyToClipboard } from "./CopyToClipboard";
import * as Fa6 from "react-icons/fa6";
import { usePredictions, type Stop, type Prediction } from "./data";

type Props = {
  predictionsResponse: NonNullable<ReturnType<typeof usePredictions>>;
  travelTimes: Map<string, { distance: number; duration: number }> | null;
  currentPosition: GeolocationPosition;
};

export function TimesList(props: Props) {
  const { predictionsResponse, travelTimes } = props;
  return (
    <div className="flex flex-col gap-2 max-h-full">
      {predictionsResponse.processed.map(([routeId, routePatterns]) => {
        const route = predictionsResponse.included.routes.get(routeId)!;
        const headingId = `route-${routeId}`;
        const displayName = [
          route.attributes.short_name,
          route.attributes.long_name.replace(/ Line$/, ""),
        ]
          .filter(Boolean)
          .at(0);
        return (
          <article
            key={routeId}
            className="grid gap-2"
            aria-labelledby={headingId}
          >
            <h2
              id={headingId}
              className="text-xl font-bold text-[var(--text-color)] bg-[var(--bg-color)] py-2 px-4 sticky top-0"
              style={{
                "--text-color": "#" + route.attributes.text_color,
                "--bg-color": "#" + route.attributes.color,
              }}
            >
              {displayName}
            </h2>
            <ul className="grid gap-2 px-4">
              {routePatterns.map(([routePatternId, stops]) => {
                // const routePattern =
                //   predictionsResponse.included.routePatterns.get(
                //     routePatternId
                //   )!;
                const headsign = predictionsResponse.included.trips.get(
                  stops.at(0)![1].at(0)!.relationships.trip.data.id
                )!.attributes.headsign;
                return (
                  <li key={routePatternId}>
                    <header className="flex gap-2 items-center">
                      <h3 className="font-bold">{headsign}</h3>
                    </header>
                    <>
                      {stops.map(([stopId, predictions]) => {
                        const stop =
                          predictionsResponse.included.stops.get(stopId)!;
                        const travelTime = travelTimes?.get(stopId);

                        return (
                          <Stop
                            stop={stop}
                            travelTime={travelTime}
                            predictions={predictions}
                            key={stopId}
                          />
                        );
                      })}
                    </>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

function Stop(props: {
  stop: Stop;
  travelTime?: { distance: number; duration: number } | null;
  predictions: Array<Prediction>;
}) {
  const { stop, travelTime, predictions } = props;
  return (
    <div>
      <div className="flex text-sm gap-2 items-center">
        <span>{stop.attributes.name}</span>
        {/* <span>({stop.id})</span>
        <CopyToClipboard
          text={[
            stop.attributes.longitude,
            stop.attributes.latitude,
          ].join(",")}
        /> */}
        {travelTime?.distance && travelTime?.duration && (
          <span className="align-middle inline-block tabular-nums">
            (
            {travelTime.distance.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
            mi, {formatSeconds(travelTime.duration)}
            {/* Hack to center SVG in inline text */}
            <span className="h-[0.875em] overflow-visible align-baseline inline-block">
              <Fa6.FaPersonWalking className="size-3.5" />
            </span>
            )
          </span>
        )}
      </div>
      <ul role="list" className="ps-4 text-end">
        {predictions
          .toSorted((p1, p2) =>
            (
              p1.attributes.departure_time ??
              p1.attributes.arrival_time ??
              ""
            ).localeCompare(
              p2.attributes.departure_time ?? p2.attributes.arrival_time ?? ""
            )
          )
          .map((prediction) => {
            const { arrival_time, departure_time, status } =
              prediction.attributes;
            return (
              <li
                key={prediction.relationships.trip.data.id}
                className="text-sm tabular-nums"
              >
                {status ??
                  (departure_time ? (
                    <relative-time datetime={departure_time}></relative-time>
                  ) : arrival_time ? (
                    <relative-time datetime={arrival_time}></relative-time>
                  ) : (
                    "Oops! Haven’t handled this"
                  ))}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

// type Duration = {
//   seconds?: number;
//   minutes?: number;
//   hours?: number;
// };

function formatSeconds(seconds: number) {
  // let rounded = Math.round(seconds);
  const minutes = Math.round(seconds / 60);
  // rounded %= 60;
  // const hours = Math.floor(minutes / 60);
  // minutes %= 60;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Intl as any).DurationFormat(undefined, {
    style: "narrow",
  }).format({
    // hours,
    minutes,
    // seconds: rounded,
  });
}
