import * as React from "react";
import * as MapBoxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as ReactDOM from "react-dom";
// import { type Stop } from "./App";

type Props = {
  padding: {
    bottom: number;
  };
  currentCoordinates: {
    latitude: number;
    longitude: number;
  };
  markerData: Array<{
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
      zoom: 14,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN!,
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [props.currentCoordinates.latitude, props.currentCoordinates.longitude]);

  React.useEffect(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({ padding: props.padding, duration: 500 });
      // mapRef.current.resize();
    }
  }, [props.padding]);

  // React.useEffect(() => {
  //   if (mapRef.current == null) return;

  //   const marker = new MapBoxGL.Marker({
  //     element: document.createElement("div"),
  //   });
  //   marker.setLngLat([
  //     props.currentCoordinates.longitude,
  //     props.currentCoordinates.latitude,
  //   ]);
  //   marker.addTo(mapRef.current);
  //   setCurrentMarkers([marker]);
  //   return () => {
  //     marker.remove();
  //   };
  // }, [props.currentCoordinates.latitude, props.currentCoordinates.longitude]);

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

    props.markerData.forEach((d) => {
      const marker = new MapBoxGL.Marker({
        element: document.createElement("div"),
      });
      marker.setLngLat([d.coordinates.longitude, d.coordinates.latitude]);
      marker.addTo(mapRef.current!);
      stopMap.set(d.id, { marker, data: d });
    });
    // setStopMarkers((currentMarkers) => {
    //   currentMarkers.forEach((marker) => marker.remove());
    //   return markers;
    // });
    setStopMarkers(Array.from(stopMap.values()));
    return () => {
      stopMap.forEach(({ marker }) => marker.remove());
    };
  }, [props.markerData]);

  return (
    <>
      <div ref={mapContainerRef} style={props.style} />
      {stopMarkers.map(({ marker, data }) =>
        ReactDOM.createPortal(data.node, marker.getElement())
      )}
    </>
  );
}
