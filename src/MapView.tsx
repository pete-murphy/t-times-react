import * as React from "react";
import * as MapBoxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as ReactDOM from "react-dom";

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

  style?: React.CSSProperties;
};

export function MapView(props: Props) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapBoxGL.Map | null>(null);
  const [markers, setMarkers] = React.useState<Array<MapBoxGL.Marker>>([]);

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
    setMarkers([marker]);
    return () => {
      marker.remove();
    };
  }, [props.currentCoordinates.latitude, props.currentCoordinates.longitude]);

  return (
    <>
      <div ref={mapContainerRef} style={props.style} />
      {markers.map((marker) =>
        ReactDOM.createPortal(
          <button className="bg-red-200 px-2 py-1 rounded-full">Hello</button>,
          marker.getElement()
        )
      )}
    </>
  );
}
