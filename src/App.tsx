import React from "react";
import { match } from "ts-pattern";
import * as d3 from "d3";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import "@github/relative-time-element";
// import { CopyToClipboard } from "./CopyToClipboard";
import * as Fa6 from "react-icons/fa6";

export function App() {
  const currentPosition = useCurrentPosition();
  const predictionsResponse = usePredictions(currentPosition.coords);
  const travelTimes = useTravelTimes(
    currentPosition.coords,
    predictionsResponse
  );

  if (!predictionsResponse) {
    return <main>Loading...</main>;
  }

  return (
    <>
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
        {/* {currentPosition && (
          <div className="flex items-center gap-2">
            <span>
              {currentPosition.coords.longitude},{" "}
              {currentPosition.coords.latitude}
            </span>
            <CopyToClipboard
              text={[
                currentPosition.coords.longitude,
                currentPosition.coords.latitude,
              ].join(",")}
            />
          </div>
        )} */}
      </header>
      <ErrorBoundary
        fallbackRender={(props: FallbackProps) => {
          return (
            <main>
              <h1>Something went wrong</h1>
              <pre>{JSON.stringify(props.error, null, 2)}</pre>
            </main>
          );
        }}
      >
        <main className="p-2 flex flex-col gap-8 max-w-md">
          {predictionsResponse && (
            <>
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
                      className="text-xl font-bold text-[var(--text-color)] bg-[var(--bg-color)] p-2"
                      style={{
                        "--text-color": "#" + route.attributes.text_color,
                        "--bg-color": "#" + route.attributes.color,
                      }}
                    >
                      {displayName}
                    </h2>
                    <ul className="grid gap-2 px-2">
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
                            <header className="bg-white flex gap-2 items-center">
                              <h3 className="text-lg font-bold">{headsign}</h3>
                            </header>
                            <>
                              {stops.map(([stopId, predictions]) => {
                                const stop =
                                  predictionsResponse.included.stops.get(
                                    stopId
                                  )!;

                                const travelTime = travelTimes?.get(stopId);
                                return (
                                  <div key={stopId}>
                                    <div className="flex gap-2 items-center">
                                      <span>{stop.attributes.name}</span>
                                      {/* <span>({stop.id})</span>
                                      <CopyToClipboard
                                        text={[
                                          stop.attributes.longitude,
                                          stop.attributes.latitude,
                                        ].join(",")}
                                      /> */}
                                      {travelTime?.distance &&
                                        travelTime?.duration && (
                                          <span className="align-middle inline-block">
                                            (
                                            {travelTime.distance.toLocaleString(
                                              undefined,
                                              {
                                                maximumFractionDigits: 1,
                                              }
                                            )}
                                            mi,{" "}
                                            {formatSeconds(travelTime.duration)}
                                            {/* Hack to center SVG in inline text */}
                                            <span className="h-3.5 overflow-visible align-baseline inline-block">
                                              <Fa6.FaPersonWalking className="size-4 " />
                                            </span>
                                            )
                                          </span>
                                        )}
                                    </div>
                                    <ul role="list" className="ps-4">
                                      {predictions.map((prediction) => {
                                        return (
                                          <li
                                            key={
                                              prediction.relationships.trip.data
                                                .id
                                            }
                                            className="text-sm"
                                          >
                                            <relative-time
                                              datetime={
                                                prediction.attributes
                                                  .arrival_time
                                              }
                                            ></relative-time>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
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
            </>
          )}
        </main>
      </ErrorBoundary>
    </>
  );
}

function useCurrentPosition() {
  const [location, setLocation] = React.useState<GeolocationPosition | null>(
    null
  );

  React.useEffect(() => {
    window.navigator.geolocation.getCurrentPosition(setLocation);
  }, []);

  // return location;
  return {
    ...location,
    coords: {
      latitude: 42.36,
      longitude: -71.058,
    },
  };
}

type Prediction = {
  type: "prediction";
  attributes: {
    arrival_time: string;
    arrival_uncertainty: number | null;
    departure_time: string;
    departure_uncertainty: number | null;
    direction_id: number;
    last_trip: boolean;
    status: string | null;
  };
  relationships: {
    route: { data: { id: string } };
    stop: { data: { id: string } };
    trip: { data: { id: string } };
    vehicle: { data: { id: string } };
  };
};
type Stop = {
  type: "stop";
  id: string;
  attributes: {
    latitude: number;
    longitude: number;
    name: string; // "W Broadway @ D St"
  };
};
type Trip = {
  type: "trip";
  id: string;
  attributes: {
    headsign: string; // "City Point"
  };
  relationships: {
    route: { data: { id: string } };
    route_pattern: { data: { id: string } };
    shape: { data: { id: string } };
  };
};
type Route = {
  type: "route";
  id: string;
  attributes: {
    color: string;
    short_name: string; // "10"
    long_name: string; //
    text_color: string;
  };
  relationships: {
    route_patterns: { data: Array<{ id: string }> };
  };
};
type Shape = {
  type: "shape";
  id: string;
  attributes: {
    polyline: string;
  };
};

type RoutePattern = {
  type: "route_pattern";
  id: string; // e.g. "9-1-0"
  attributes: {
    canonical: boolean;
    direction_id: number;
    name: string; // "Copley Station - City Point via L St"
    sort_order: number;
    time_desc: string; // "Weekdays only"
    typicality: number;
  };
  relationships: {
    route: { data: { id: string } };
    representative_trip: { data: { id: string } };
  };
};

type PredictionsResponse = {
  data: Array<Prediction>;
  included: Array<Stop | Trip | Shape | Route | RoutePattern>;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

function usePredictions(currentCoords: Coordinates | null) {
  const [predictionsResponse, setPredictionsResponse] =
    React.useState<PredictionsResponse | null>(null);

  const url = React.useMemo(() => {
    if (currentCoords === null) {
      return null;
    }
    const queryParams = new URLSearchParams({
      "filter[latitude]": currentCoords.latitude.toString(),
      "filter[longitude]": currentCoords.longitude.toString(),
      // "filter[radius]": "0.005",
      "filter[route_type]": "0,1,2,3",
      include: [
        "stop",
        "route",
        "trip",
        "vehicle",
        "route.route_patterns.representative_trip.shape",
      ].join(","),

      fields: ["arrival_time", "departure_time", "arrival_uncertainty"].join(
        ","
      ),
      "fields[route]": ["text_color", "short_name", "long_name", "color"].join(
        ","
      ),
      "fields[stop]": ["name", "longitude", "latitude"].join(","),
      "fields[trip]": ["headsign"].join(","),
      api_key: import.meta.env.VITE_MBTA_API_KEY!,
    });

    return `https://api-v3.mbta.com/predictions` + "?" + queryParams.toString();
  }, [currentCoords]);

  React.useEffect(() => {
    if (url) {
      fetch(url)
        .then((res) => res.json())
        .then(setPredictionsResponse);
    }
  }, [url]);

  if (!predictionsResponse || !currentCoords) {
    return null;
  }

  const included = {
    stops: new Map<string, Stop>(),
    routes: new Map<string, Route>(),
    trips: new Map<string, Trip>(),
    routePatterns: new Map<string, RoutePattern>(),
    shapes: new Map<string, Shape>(),
  };

  predictionsResponse.included.forEach((d) => {
    match(d)
      .with({ type: "stop" }, (d) => {
        included.stops.set(d.id, d);
      })
      .with({ type: "route" }, (d) => {
        included.routes.set(d.id, d);
      })
      .with({ type: "trip" }, (d) => {
        included.trips.set(d.id, d);
      })
      .with({ type: "shape" }, (d) => {
        included.shapes.set(d.id, d);
      })
      .with({ type: "route_pattern" }, (d) => {
        included.routePatterns.set(d.id, d);
      });
  });

  const routePatternForTrip = (tripId: string): RoutePattern => {
    const trip = included.trips.get(tripId)!;
    return included.routePatterns.get(
      trip.relationships.route_pattern.data.id
    )!;
  };
  const processedMap = d3.group(
    predictionsResponse.data,
    (d) => d.relationships.route.data.id,
    (d) => routePatternForTrip(d.relationships.trip.data.id).id,
    (d) => d.relationships.stop.data.id
  );
  const processed = Array.from(processedMap)
    .toSorted(([x], [y]) =>
      x.localeCompare(y, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )
    .map(([routeId, routePatterns]) => {
      return [
        routeId,
        Array.from(routePatterns).map(([routePatternId, stops]) => {
          return [
            routePatternId,
            Array.from(stops)
              .toSorted(([idX], [idY]) => {
                const x = included.stops.get(idX)!;
                const y = included.stops.get(idY)!;
                return (
                  haversine(x.attributes, currentCoords) -
                  haversine(y.attributes, currentCoords)
                );
              })
              .slice(0, 1),
          ] as const;
        }),
      ] as const;
    });

  return {
    processed,
    included,
  };
}

function haversine(
  location1: { latitude: number; longitude: number },
  location2: { latitude: number; longitude: number }
): number {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;
  const distance = (a: number, b: number) => (Math.PI / 180) * (a - b);

  const dLat = distance(location2.latitude, location1.latitude);
  const dLon = distance(location2.longitude, location1.longitude);
  const lat1 = toRadian(location1.latitude);
  const lat2 = toRadian(location2.latitude);

  // Haversine Formula
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  // return RADIUS_OF_EARTH_IN_KM * c;
  return c;
}

function useTravelTimes(
  currentCoords: Coordinates | null,
  predictionsResponse: ReturnType<typeof usePredictions> | null
) {
  const [response, setResponse] = React.useState<MatrixResponse | null>(null);
  const stops = React.useMemo(() => {
    if (!predictionsResponse) {
      return null;
    }
    const stopIds = Array.from(
      new Set(
        Array.from(predictionsResponse.processed.values()).flatMap(
          ([, routePatterns]) =>
            routePatterns.flatMap(([, stops]) =>
              stops.map(([stopId]) => stopId)
            )
        )
      )
    );
    return stopIds.map((id) => {
      const stop = predictionsResponse.included.stops.get(id)!;
      return [id, stop.attributes] as const;
    });
  }, [predictionsResponse]);

  const url = React.useMemo(() => {
    if (!currentCoords || !stops) {
      return null;
    }

    const locations = [
      currentCoords,
      ...stops.map(([, { latitude, longitude }]) => ({ latitude, longitude })),
    ]
      .map(({ latitude, longitude }) => `${longitude},${latitude}`)
      .slice(0, 24) // TODO: handle more than 25 stops
      .join(";");

    const queryParams = new URLSearchParams({
      sources: "0",
      annotations: "distance,duration",
      access_token: import.meta.env.VITE_MAPBOX_TOKEN!,
    });

    return `https://api.mapbox.com/directions-matrix/v1/mapbox/walking/${locations}?${queryParams.toString()}`;
  }, [currentCoords, stops]);

  React.useEffect(() => {
    if (url != null) {
      fetch(url)
        .then((res) => res.json())
        .then(setResponse);
    }
  }, [url]);

  const processed = React.useMemo(() => {
    if (!response || !stops) {
      return null;
    }

    const map = new Map<
      string,
      { distance: number | null; duration: number | null }
    >();
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const duration = response.durations[0][i + 1] ?? null;
      let distance = response.distances[0][i + 1] ?? null;
      if (distance != null) {
        distance *= 0.000621371; // convert to miles
      }
      map.set(stop[0], { distance, duration });
    }

    return map;
  }, [response, stops]);

  return processed;
}

type MatrixResponse = {
  code: string;
  distances: Array<(number | null)[]>; // in meters
  destinations: Destination[];
  durations: Array<(number | null)[]>; // in seconds
  sources: Destination[];
};

export type Destination = {
  // distance: number;
  name: string;
  location: [number, number];
};

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
