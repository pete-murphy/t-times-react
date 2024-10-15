import "@github/relative-time-element";
// import { CopyToClipboard } from "./CopyToClipboard";
import * as Fa6 from "react-icons/fa6";
import { usePredictions } from "./data";

type Props = {
  predictionsResponse: NonNullable<ReturnType<typeof usePredictions>>;
  travelTimes: Map<string, { distance: number; duration: number }> | null;
  currentPosition: GeolocationPosition;
};

function InlineIcon() {
  {
    /* Hack to center SVG in inline text */
  }
  return (
    <span className="h-[0.875em] overflow-visible align-baseline inline-block">
      <Fa6.FaPersonWalking className="size-3" />
    </span>
  );
}

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
            // className="grid gap-2"
            aria-labelledby={headingId}
          >
            <h2 className="sr-only" id={headingId}>
              {displayName}
            </h2>
            <ul className="grid gap-2 px-4">
              {routePatterns.map(([routePatternId, stops]) => {
                // const routePattern =
                //   predictionsResponse.included.routePatterns.get(
                //     routePatternId
                //   )!;
                const [stopId, predictionsUnsorted] = stops.at(0)!;
                const stop = predictionsResponse.included.stops.get(stopId)!;
                const travelTime = travelTimes?.get(stopId);

                const predictions = predictionsUnsorted.toSorted((p1, p2) =>
                  (
                    p1.attributes.departure_time ??
                    p1.attributes.arrival_time ??
                    ""
                  ).localeCompare(
                    p2.attributes.departure_time ??
                      p2.attributes.arrival_time ??
                      ""
                  )
                );

                const headsign = predictionsResponse.included.trips.get(
                  predictions.at(0)!.relationships.trip.data.id
                )!.attributes.headsign;

                const nextPrediction =
                  travelTime?.duration == null
                    ? predictions.at(0)!
                    : predictions.find((prediction) => {
                        const departure_time =
                          prediction.attributes.departure_time;
                        if (departure_time == null) return false;
                        // true if the departure time is after the current time plus the travel time
                        return (
                          new Date(departure_time).valueOf() >
                          new Date().valueOf() + travelTime.duration * 1000
                        );
                      }) ?? predictions.at(0)!;

                return (
                  <li
                    key={routePatternId}
                    className="grid grid-cols-[auto_1fr]"
                  >
                    <div className="grid">
                      <header className="flex gap-2 items-center">
                        <span
                          className="text-xs rounded-full font-bold text-[var(--text-color)] bg-[var(--bg-color)] py-0.5 px-3 sticky top-0"
                          style={{
                            "--text-color": "#" + route.attributes.text_color,
                            "--bg-color": "#" + route.attributes.color,
                          }}
                        >
                          {displayName}
                        </span>
                        <h3 className="font-bold line-clamp-1">{headsign}</h3>
                      </header>

                      <div className="flex text-neutral-800 text-xs gap-2 items-center">
                        <span>{stop.attributes.name}</span>
                        {travelTime?.distance && travelTime?.duration && (
                          <span className="align-middle inline-block tabular-nums">
                            {travelTime.distance.toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })}
                            mi
                            <InlineIcon />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid items-center justify-end">
                      <div className="tabular-nums text-end font-bold">
                        {nextPrediction.attributes.status ??
                          (nextPrediction.attributes.departure_time ? (
                            new Date(nextPrediction.attributes.departure_time)
                              .toLocaleTimeString(undefined, {
                                // hourCycle: "h12",
                                hour: "2-digit",
                                minute: "2-digit",
                                // hourCycle: "h23",
                                // hour12: false,
                              })
                              .slice(0, -3)
                          ) : (
                            <></>
                          ))}
                      </div>
                      <div className="text-xs text-end">
                        {nextPrediction.attributes.status ??
                          (nextPrediction.attributes.departure_time &&
                          travelTime?.duration ? (
                            <span>
                              Go{" "}
                              <relative-time
                                datetime={new Date(
                                  new Date(
                                    nextPrediction.attributes.departure_time
                                  ).valueOf() -
                                    travelTime.duration * 1000
                                ).toISOString()}
                              ></relative-time>
                            </span>
                          ) : nextPrediction.attributes.arrival_time ? (
                            <relative-time
                              datetime={nextPrediction.attributes.arrival_time}
                            ></relative-time>
                          ) : (
                            "Oops! Haven’t handled this"
                          ))}
                      </div>
                    </div>
                    {/* <>
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
                    </> */}
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

// function Stop(props: {
//   // routeDisplayName: string,
//   // routeDisplayColor: string,
//   // routeDisplayTextColor: string,
//   // headsign: string,

//   stop: Stop;
//   travelTime?: { distance: number; duration: number } | null;
//   predictions: Array<Prediction>;
// }) {
//   const { stop, travelTime, predictions } = props;
//   return (
//     <div>
//       <ul role="list" className="ps-4 text-end">
//         {predictions.map((prediction) => {
//           const { arrival_time, departure_time, status } =
//             prediction.attributes;
//           return (
//             <li
//               key={prediction.relationships.trip.data.id}
//               className="text-sm tabular-nums"
//             >
//               {status ??
//                 (departure_time ? (
//                   <relative-time datetime={departure_time}></relative-time>
//                 ) : arrival_time ? (
//                   <relative-time datetime={arrival_time}></relative-time>
//                 ) : (
//                   "Oops! Haven’t handled this"
//                 ))}
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }

// type Duration = {
//   seconds?: number;
//   minutes?: number;
//   hours?: number;
// };

// function formatSeconds(seconds: number) {
//   const minutes = Math.round(seconds / 60);
//   const mins = minutes > 1 ? "mins" : "min";
//   return minutes + " " + mins;
// }
