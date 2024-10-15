// import stopsJSON from "./stops.json";

// {
//   "attributes": {
//     "address": null,
//     "at_street": null,
//     "description": "Bellingham Square - Washington Avenue",
//     "latitude": 42.395247,
//     "location_type": 2,
//     "longitude": -71.033173,
//     "municipality": "Chelsea",
//     "name": "Bellingham Square - Washington Avenue",
//     "on_street": null,
//     "platform_code": null,
//     "platform_name": null,
//     "vehicle_type": null,
//     "wheelchair_boarding": 1
//   },
//   "id": "door-belsq-washington",
//   "links": {
//     "self": "/stops/door-belsq-washington"
//   },
//   "relationships": {
//     "facilities": {
//       "links": {
//         "related": "/facilities/?filter[stop]=door-belsq-washington"
//       }
//     },
//     "parent_station": {
//       "data": {
//         "id": "place-belsq",
//         "type": "stop"
//       }
//     },
//     "zone": {
//       "data": null
//     }
//   },
//   "type": "stop"
// }

// type Stop = {
//   attributes: {
//     latitude: number;
//     longitude: number;
//     name: string;
//   };
//   id: string;
// };

export async function fetchIsochrones({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  // TODO
  console.error("fetchIsochrones not implemented", { latitude, longitude });
}

// async function main() {
//   const stops = (
//     stopsJSON as unknown as {
//       data: Stop[];
//     }
//   ).data;
//   for (const stop of stops) {
//     console.log(stop.attributes.name);
//   }
// }
