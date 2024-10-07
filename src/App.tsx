import React from "react";
import { match } from "ts-pattern";
import * as d3 from "d3";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import "@github/relative-time-element";
import { CopyToClipboard } from "./CopyToClipboard";
// import * as Fa6 from "react-icons/fa6";

export function App() {
  const location = useLocation();
  const predictionsResponse = usePredictions(location);

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
        {location && (
          <div className="flex items-center gap-2">
            <span>
              {location.coords.longitude}, {location.coords.latitude}
            </span>
            <CopyToClipboard
              text={[location.coords.longitude, location.coords.latitude].join(
                ","
              )}
            />
          </div>
        )}
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
        <main className="p-2">
          {predictionsResponse && (
            <ul>
              {Array.from(predictionsResponse.processed)
                .toSorted(([x], [y]) =>
                  x.localeCompare(y, undefined, {
                    numeric: true,
                    sensitivity: "base",
                  })
                )
                .map(([routeId, routePatterns]) => {
                  const route =
                    predictionsResponse.included.routes.get(routeId)!;
                  return (
                    <li key={routeId} className="grid grid-cols-[2rem_auto]">
                      <h2
                        className="text-xl font-bold text-[var(--text-color)] bg-[var(--bg-color)] "
                        style={{
                          "--text-color": "#" + route.attributes.text_color,
                          "--bg-color": "#" + route.attributes.color,
                        }}
                      >
                        <span className="sticky top-0 h-min">
                          {route.attributes.short_name}
                        </span>
                      </h2>
                      <ul>
                        {Array.from(routePatterns).map(
                          ([routePatternId, stops]) => {
                            const routePattern =
                              predictionsResponse.included.routePatterns.get(
                                routePatternId
                              )!;
                            const headsign =
                              predictionsResponse.included.trips.get(
                                [...stops.values()].at(0)!.at(0)!.relationships
                                  .trip.data.id
                              )!.attributes.headsign;
                            return (
                              <li key={routePatternId}>
                                <header className="sticky top-0 bg-white flex gap-2 items-center">
                                  <h3 className="text-lg font-bold">
                                    {headsign}
                                  </h3>
                                  <div className="">({routePattern.id})</div>
                                </header>
                                <ul>
                                  {Array.from(stops)
                                    .toSorted(([idX], [idY]) => {
                                      const x =
                                        predictionsResponse.included.stops.get(
                                          idX
                                        )!;
                                      const y =
                                        predictionsResponse.included.stops.get(
                                          idY
                                        )!;
                                      return (
                                        haversine(
                                          x.attributes,
                                          location!.coords
                                        ) -
                                        haversine(
                                          y.attributes,
                                          location!.coords
                                        )
                                      );
                                    })
                                    .slice(0, 2)
                                    .map(([stopId, predictions]) => {
                                      const stop =
                                        predictionsResponse.included.stops.get(
                                          stopId
                                        )!;
                                      console.log({ stopId });
                                      return (
                                        <li key={stopId}>
                                          <div className="flex gap-2 items-center">
                                            <span>{stop.attributes.name}</span>
                                            <span>({stop.id})</span>
                                            <CopyToClipboard
                                              text={[
                                                stop.attributes.longitude,
                                                stop.attributes.latitude,
                                              ].join(",")}
                                            />
                                          </div>
                                          <ul>
                                            {predictions.map((prediction) => {
                                              return (
                                                <li
                                                  key={
                                                    prediction.relationships
                                                      .trip.data.id
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
                                        </li>
                                      );
                                    })}
                                </ul>
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </li>
                  );
                })}
            </ul>
          )}
        </main>
      </ErrorBoundary>
    </>
  );
}
function useLocation() {
  const [location, setLocation] = React.useState<GeolocationPosition | null>(
    null
  );

  React.useEffect(() => {
    window.navigator.geolocation.getCurrentPosition(setLocation);
  }, []);

  return location;
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

async function fetchPredictions(location: GeolocationPosition) {
  const queryParams = new URLSearchParams({
    "filter[latitude]": location.coords.latitude.toString(),
    "filter[longitude]": location.coords.longitude.toString(),
    "filter[radius]": "0.01",
    "filter[route_type]": "0,1,2,3",
    include: [
      "stop",
      "route",
      "trip",
      "vehicle",
      "route.route_patterns.representative_trip.shape",
    ].join(","),

    fields: ["arrival_time", "departure_time", "arrival_uncertainty"].join(","),
    "fields[route]": ["text_color", "short_name", "color"].join(","),
    "fields[stop]": ["name", "longitude", "latitude"].join(","),
    "fields[trip]": ["headsign"].join(","),
  });

  const url =
    `https://api-v3.mbta.com/predictions` + "?" + queryParams.toString();

  const response = await fetch(url).then((res) => res.json());

  return response;
}

function usePredictions(location: GeolocationPosition | null) {
  const [predictionsResponse, setPredictionsResponse] =
    React.useState<PredictionsResponse | null>(null);
  React.useEffect(() => {
    if (location !== null) {
      void fetchPredictions(location).then(setPredictionsResponse);
    }
  }, [location]);

  if (!predictionsResponse) {
    return null;
  }

  const stops = new Map<string, Stop>();
  const routes = new Map<string, Route>();
  const trips = new Map<string, Trip>();
  const routePatterns = new Map<string, RoutePattern>();
  const shapes = new Map<string, Shape>();

  predictionsResponse.included.forEach((d) => {
    match(d)
      .with({ type: "stop" }, (d) => {
        stops.set(d.id, d);
      })
      .with({ type: "route" }, (d) => {
        routes.set(d.id, d);
      })
      .with({ type: "trip" }, (d) => {
        trips.set(d.id, d);
      })
      .with({ type: "shape" }, (d) => {
        shapes.set(d.id, d);
      })
      .with({ type: "route_pattern" }, (d) => {
        routePatterns.set(d.id, d);
      });
  });
  const included = { stops, routes, trips, routePatterns, shapes };

  const routePatternForTrip = (tripId: string): RoutePattern => {
    const trip = included.trips.get(tripId)!;
    return included.routePatterns.get(
      trip.relationships.route_pattern.data.id
    )!;
  };
  const processed = d3.group(
    predictionsResponse.data,
    (d) => d.relationships.route.data.id,
    (d) => routePatternForTrip(d.relationships.trip.data.id).id,
    (d) => d.relationships.stop.data.id
  );

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
