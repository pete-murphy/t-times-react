import * as React from "react";
import * as MapBoxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as ReactDOM from "react-dom";
// import { type Stop } from "./App";

type Props = {
  currentCoordinates: {
    latitude: number;
    longitude: number;
  };
  vehicles: Array<{
    id: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    bearing: number;
  }>;
  stops: Array<{
    id: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    node: React.ReactNode;
  }>;

  style?: React.CSSProperties;
};

export function MapView(props: Props) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapBoxGL.Map | null>(null);
  const [currentMarkers, setCurrentMarkers] = React.useState<
    Array<MapBoxGL.Marker>
  >([]);
  const [stopMarkers, setStopMarkers] = React.useState<
    Array<{
      marker: MapBoxGL.Marker;
      data: {
        id: string;
        coordinates: {
          latitude: number;
          longitude: number;
        };
        node: React.ReactNode;
      };
    }>
  >([]);

  React.useEffect(() => {
    if (mapContainerRef.current == null) return;

    mapRef.current = new MapBoxGL.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/pfmurphy/cm20q06ap003v01qmbh17h0g4",
      center: [
        props.currentCoordinates.longitude,
        props.currentCoordinates.latitude,
      ],
      zoom: 16,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN!,
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [props.currentCoordinates.latitude, props.currentCoordinates.longitude]);

  React.useEffect(() => {
    if (mapRef.current == null) return;

    const marker = new MapBoxGL.Marker({
      element: document.createElement("div"),
    });
    marker.setLngLat([
      props.currentCoordinates.longitude,
      props.currentCoordinates.latitude,
    ]);
    marker.addTo(mapRef.current);
    setCurrentMarkers([marker]);
    return () => {
      marker.remove();
    };
  }, [props.currentCoordinates.latitude, props.currentCoordinates.longitude]);

  React.useEffect(() => {
    if (mapRef.current == null) return;

    const stopMap: Map<
      string,
      {
        marker: MapBoxGL.Marker;
        data: {
          id: string;
          coordinates: {
            latitude: number;
            longitude: number;
          };
          node: React.ReactNode;
        };
      }
    > = new Map();

    props.stops.forEach((stop) => {
      const marker = new MapBoxGL.Marker({
        element: document.createElement("div"),
      });
      marker.setLngLat([stop.coordinates.longitude, stop.coordinates.latitude]);
      marker.addTo(mapRef.current!);
      stopMap.set(stop.id, { marker, data: stop });
    });
    // setStopMarkers((currentMarkers) => {
    //   currentMarkers.forEach((marker) => marker.remove());
    //   return markers;
    // });
    setStopMarkers(Array.from(stopMap.values()));
    return () => {
      stopMap.forEach(({ marker }) => marker.remove());
    };
  }, [props.stops]);

  return (
    <>
      <div ref={mapContainerRef} style={props.style} />
      {currentMarkers.map((marker) =>
        ReactDOM.createPortal(
          <button className="bg-red-200 px-2 py-1 rounded-full">Hello</button>,
          marker.getElement()
        )
      )}
      {stopMarkers.map(({ marker, data }) =>
        ReactDOM.createPortal(data.node, marker.getElement())
      )}
    </>
  );
}
