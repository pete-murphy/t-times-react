import * as React from "react";
import { match } from "ts-pattern";
import * as d3 from "d3";

export function useCurrentPosition(params?: {
  override?: Coordinates;
}): GeolocationPosition | null {
  const [location, setLocation] = React.useState<GeolocationPosition | null>(
    null
  );

  React.useEffect(() => {
    window.navigator.geolocation.getCurrentPosition(setLocation);
  }, []);

  if (params?.override != null) {
    if (location != null) {
      return {
        ...location,
        coords: {
          ...location.coords,
          ...params.override,
        },
      };
    }
    return null;
  }
  return location;
}

export type Prediction = {
  type: "prediction";
  attributes: {
    arrival_time: string;
    arrival_uncertainty: number | null;
    departure_time: string | null;
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
export type Stop = {
  type: "stop";
  id: string;
  attributes: {
    latitude: number;
    longitude: number;
    name: string; // "W Broadway @ D St"
  };
};
export type Trip = {
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
export type Route = {
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
export type Shape = {
  type: "shape";
  id: string;
  attributes: {
    polyline: string;
  };
};

export type RoutePattern = {
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

export type PredictionsResponse = {
  data: Array<Prediction>;
  included: Array<Stop | Trip | Shape | Route | RoutePattern>;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function usePredictions(currentCoords: Coordinates | null) {
  const [predictionsResponse, setPredictionsResponse] =
    React.useState<PredictionsResponse | null>(null);

  const url = React.useMemo(() => {
    if (currentCoords === null) {
      return null;
    }
    const queryParams = new URLSearchParams({
      "filter[latitude]": currentCoords.latitude.toString(),
      "filter[longitude]": currentCoords.longitude.toString(),
      "filter[radius]": "0.005",
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
    const trip = included.trips.get(tripId);
    if (!trip || !trip.relationships.route_pattern.data?.id) {
      console.log(trip);
      console.log(trip?.relationships.route_pattern);
      throw new Error("Trip not found");
    }
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

  const flattened = {
    // stops: processed.flatMap(([routeId, routePatterns]) => {
    //   return routePatterns.flatMap(([routePatternId, stops]) =>
    //     stops.map(([stopId, _]) => {
    //       const stop = included.stops.get(stopId)!;
    //       return {
    //         stop,
    //         route: included.routes.get(routeId)!,
    //         routePattern: included.routePatterns.get(routePatternId)!,
    //       };
    //     })
    //   );
    // }),
    // colorForStop:
  };

  // console.log
  return {
    processed,
    included,
    flattened,
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

export function useTravelTimes(
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

    const map = new Map<string, { distance: number; duration: number }>();
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const duration = response.durations[0][i + 1] ?? null;
      let distance = response.distances[0][i + 1] ?? null;
      if (distance != null) {
        distance *= 0.000621371; // convert to miles
      }
      if (duration != null && distance != null) {
        map.set(stop[0], { distance, duration });
      }
    }

    return map;
  }, [response, stops]);

  return processed;
}

export type MatrixResponse = {
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
