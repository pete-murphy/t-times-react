import * as React from "react";
import * as MapBoxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as ReactDOM from "react-dom";
import { style } from "./mapbox/style";
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
      // style: "mapbox://styles/pfmurphy/cm20q06ap003v01qmbh17h0g4",
      style: style,
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
    }
  }, [props.padding]);

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
    setStopMarkers(Array.from(stopMap.values()));
    return () => {
      stopMap.forEach(({ marker }) => marker.remove());
    };
  }, [props.markerData]);

  React.useEffect(() => {
    if (mapRef.current == null) return;
    mapRef.current.on("style.load", () => {
      if (mapRef.current == null) return;

      // TODO: better way of making/using a blue dot?
      mapRef.current.loadImage("/img/dot.png", (error, image) => {
        if (error) throw error;
        if (mapRef.current == null) return;

        mapRef.current.addImage("pattern-dot", image!);

        mapRef.current.addSource("route-data", {
          type: "geojson",
          lineMetrics: true,
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              coordinates: [
                [
                  props.currentCoordinates.longitude,
                  props.currentCoordinates.latitude,
                ],
                ...props.markerData
                  .slice(0, 1)
                  .map((d) => [
                    d.coordinates.longitude,
                    d.coordinates.latitude,
                  ]),
              ],
              type: "LineString",
            },
          },
        });

        const lineBaseWidth = 12;

        mapRef.current.addLayer({
          id: "route-line",
          type: "line",
          source: "route-data",
          layout: {
            "line-join": "none",
          },
          paint: {
            "line-opacity": 0.5,
            "line-pattern": "pattern-dot",
            "line-width": [
              "interpolate",
              ["exponential", 2],
              ["zoom"],
              0,
              lineBaseWidth * 1,
              0.9999,
              lineBaseWidth * 2,
              1,
              lineBaseWidth * 1,
              1.9999,
              lineBaseWidth * 2,
              2,
              lineBaseWidth * 1,
              2.9999,
              lineBaseWidth * 2,
              3,
              lineBaseWidth * 1,
              3.9999,
              lineBaseWidth * 2,
              4,
              lineBaseWidth * 1,
              4.9999,
              lineBaseWidth * 2,
              5,
              lineBaseWidth * 1,
              5.9999,
              lineBaseWidth * 2,
              6,
              lineBaseWidth * 1,
              6.9999,
              lineBaseWidth * 2,
              7,
              lineBaseWidth * 1,
              7.9999,
              lineBaseWidth * 2,
              8,
              lineBaseWidth * 1,
              8.9999,
              lineBaseWidth * 2,
              9,
              lineBaseWidth * 1,
              9.9999,
              lineBaseWidth * 2,
              10,
              lineBaseWidth * 1,
              10.9999,
              lineBaseWidth * 2,
              11,
              lineBaseWidth * 1,
              11.9999,
              lineBaseWidth * 2,
              12,
              lineBaseWidth * 1,
              12.9999,
              lineBaseWidth * 2,
              13,
              lineBaseWidth * 1,
              13.9999,
              lineBaseWidth * 2,
              14,
              lineBaseWidth * 1,
              14.9999,
              lineBaseWidth * 2,
              15,
              lineBaseWidth * 1,
              15.9999,
              lineBaseWidth * 2,
              16,
              lineBaseWidth * 1,
              16.9999,
              lineBaseWidth * 2,
              17,
              lineBaseWidth * 1,
              17.9999,
              lineBaseWidth * 2,
              18,
              lineBaseWidth * 1,
              18.9999,
              lineBaseWidth * 2,
              19,
              lineBaseWidth * 1,
              19.9999,
              lineBaseWidth * 2,
              20,
              lineBaseWidth * 1,
              20.9999,
              lineBaseWidth * 2,
              21,
              lineBaseWidth * 1,
              22,
              lineBaseWidth * 2,
            ],
          },
        });
      });
    });
  }, [props.currentCoordinates.latitude, props.currentCoordinates.longitude]);

  return (
    <>
      <div ref={mapContainerRef} style={props.style} />
      {stopMarkers.map(({ marker, data }) =>
        ReactDOM.createPortal(data.node, marker.getElement())
      )}
    </>
  );
}
