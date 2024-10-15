import { URLSearchParams } from "node:url";

function fetchStops({
  latitude,
  longitude,
}: {
  latitude: string;
  longitude: string;
}) {
  const queryParams = new URLSearchParams({
    "filter[latitude]": latitude,
    "filter[longitude]": longitude,
    "filter[radius]": "0.01",
    "filter[route_type]": "0,1,2,3",
    fields: ["name", "longitude", "latitude"].join(","),
    api_key: process.env.VITE_MBTA_API_KEY!,
  });

  const url = `https://api-v3.mbta.com/stops` + "?" + queryParams.toString();

  return fetch(url).then((res) => res.json()) as Promise<{
    data: Array<{
      attributes: {
        latitude: number;
        longitude: number;
      };
      id: string;
    }>;
  }>;
}

async function main() {
  const acc: Array<{
    source: LatLong;
    destination: LatLong;
    haversineDistance: number;
    mapboxDistance: number;
    mapboxDuration: number;
  }> = [];

  const locations = `
42.33595198237266, -71.032695073523
42.34388361322074, -71.0434177603622
42.33628365219322, -71.05167442739507
42.32465163039584, -71.06133316996184
42.32108097444604, -71.04746820079342
42.31946835372366, -71.07457499444854
42.342005905781846, -71.07817470326238
42.33190045677075, -71.0828255864755
42.344676715003985, -71.08455466344066
42.353862905962494, -71.08027263785604
42.350542884897784, -71.08501644411635
42.35928321716654, -71.09109642828042
42.36949668566739, -71.0787813810755
42.37689162863526, -71.08219489837639
42.38165284072081, -71.08855312849789
42.39236383282632, -71.09474250502416
42.4135540012003, -71.09954166374911
42.41400812916352, -71.08750760065311
42.42766750493925, -71.09190598349622
42.37086583900356, -71.11926830865788
42.39213265784804, -71.12446660608231
42.39921999670019, -71.12813207221492
42.38651090422103, -71.13110920698581
42.39077070389522, -71.15628076524887
42.41429668201171, -71.14887849596005
42.36889926070901, -71.18339939209955
42.34710232730544, -71.17626400228367
42.35505931952604, -71.17709221715363
42.35491807992532, -71.16192951414985
42.303782755410445, -71.09898589591404
42.287782760030936, -71.08414112642373
42.280984146073756, -71.1307961162504
42.24666610244156, -71.14790294723821
42.31864747776036, -71.158217503809
42.37929861614238, -71.03401319469515
42.369102064889546, -71.03423581197382
42.367408737059264, -71.05145978826299
42.37231401923063, -71.059264927755
42.38436964981385, -71.0697562526223
42.39710616025463, -71.03133319615877
42.409320323290295, -71.0084365444786
42.382417594780854, -71.01741776770204
42.343791355516764, -71.09890893404595
42.351815292632594, -71.11472067938574
42.364235914884325, -71.12271339419021
`
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [latitude, longitude] = line
        .split(", ")
        .map(Number)
        .map((n) => n.toFixed(4));
      return { latitude, longitude };
    });

  for (const location of locations) {
    console.error("Fetching for", location);
    const stops = await fetchStops(location);
    const source = location;
    const destinations = stops.data.map((stop) => ({
      latitude: stop.attributes.latitude.toFixed(4),
      longitude: stop.attributes.longitude.toFixed(4),
    }));

    const matrix = await fetchMatrix({ source, destinations });

    await new Promise((resolve) => setTimeout(resolve, 200));

    for (let i = 0; i < stops.data.length; i++) {
      const stop = stops.data[i];
      const destination = {
        latitude: stop.attributes.latitude.toFixed(4),
        longitude: stop.attributes.longitude.toFixed(4),
      };
      const haversineDistance = haversine(source, destination);
      const mapboxDistance_ = matrix.distances[0][i + 1] ?? null; // in meters
      const mapboxDistance =
        mapboxDistance_ != null ? mapboxDistance_ / 1609.34 : null; // convert to miles
      const mapboxDuration = matrix.durations[0][i + 1] ?? null;

      if (mapboxDistance != null && mapboxDuration != null) {
        acc.push({
          source,
          destination,
          haversineDistance,
          mapboxDistance,
          mapboxDuration,
        });
      }
    }
  }

  // for (const a of acc) {
  //   console.log(a);
  // }
  console.log(JSON.stringify(acc, null, 2));
}

// function* loop(iterations: number, delay: number) {
//   for (let i = 0; i < iterations; i++) {
//     yield new Promise((resolve) => setTimeout(resolve, delay));
//   }
// }

// function fromEntries<A>(
//   iterable: Iterable<readonly [string, ReadonlyArray<A>]>
// ): ReadonlyMap<string, ReadonlyArray<A>> {
//   const out = new Map<string, ReadonlyArray<A>>();
//   for (const [key, value] of iterable) {
//     out.set(key, (out.get(key) ?? []).concat(value));
//   }
//   return out;
// }

type LatLong = {
  latitude: string;
  longitude: string;
};

function fetchMatrix({
  source,
  destinations,
}: {
  source: LatLong;
  destinations: ReadonlyArray<LatLong>;
}) {
  const locations = [source, ...destinations]
    .map(({ latitude, longitude }) => `${longitude},${latitude}`)
    .slice(0, 24) // TODO: handle more than 25 stops
    .join(";");

  const queryParams = new URLSearchParams({
    sources: "0",
    annotations: "distance,duration",
    access_token: process.env.VITE_MAPBOX_TOKEN!,
  });

  const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/walking/${locations}?${queryParams.toString()}`;

  return fetch(url).then((res) => res.json()) as Promise<MatrixResponse>;
}

type MatrixResponse = {
  code: string;
  distances: Array<(number | null)[]>; // in meters
  destinations: Destination[];
  durations: Array<(number | null)[]>; // in seconds
  sources: Destination[];
};

type Destination = {
  name: string;
  location: [number, number];
};

main();

function haversine(location1: LatLong, location2: LatLong): number {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;
  const distance = (a: number, b: number) => (Math.PI / 180) * (a - b);

  const dLat = distance(+location2.latitude, +location1.latitude);
  const dLon = distance(+location2.longitude, +location1.longitude);
  const lat1 = toRadian(+location1.latitude);
  const lat2 = toRadian(+location2.latitude);

  // Haversine Formula
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  const RADIUS_OF_EARTH_IN_KM = 6371;
  return RADIUS_OF_EARTH_IN_KM * c;
  // return c;
}

// function oldLocations() {
//   const locations = [
//     { latitude: "42.3551", longitude: "-71.0657" },
//     { latitude: "42.3493", longitude: "-71.0782" },
//     { latitude: "42.3463", longitude: "-71.0972" },
//     { latitude: "42.3602", longitude: "-71.0551" },
//   ];
//   const otherLocations = `
// 42.37460317670343, -71.08248756140554
// 42.387214411117476, -71.10269747229613
// 42.39460011459709, -71.11291260344257
// 42.38339038047661, -71.13043840973491
// 42.39891218970463, -71.13091736606343
// 42.410075800467645, -71.12265482945816
// 42.40751906018656, -71.10848181889372
// 42.396066011330475, -71.09273726986858
// 42.38147231870048, -71.0795967962157
// 42.37739874967344, -71.06519629567211
// 42.38234061964157, -71.06621652459364
// 42.37542706606492, -71.12516261378477
// 42.37088917473522, -71.13822386996723
// 42.36426694126697, -71.10950171865815
// 42.37484759837055, -71.10958123672265
// 42.35839063837323, -71.0984068914984
// 42.36141286972774, -71.08455632715133
// 42.35983771163613, -71.06778805255433
// 42.36687080448533, -71.05573921255329
// 42.36408330021621, -71.06747071624544
// 42.35116984421784, -71.06212632776383
// 42.36170226744392, -71.12658379631812
// 42.3679216609016, -71.14114949646087
// 42.3555928737253, -71.13736420429747
// 42.34832575974092, -71.12579213731632
// 42.34303317843461, -71.12571172579192
// 42.34123211106678, -71.11194118868542
// 42.34911746653381, -71.11079008420815
// 42.338182165985664, -71.09766331565824
// 42.34148204322083, -71.09579700480003
// 42.3361138115394, -71.10332727685241
// 42.335423276132815, -71.12205056331351
// 42.33251209306841, -71.13951109110366
// 42.32157987791861, -71.09493292523088
// 42.3265036118557, -71.08120589379716
// 42.32851996143271, -71.06974361634722
// `
//     .split("\n")
//     .filter(Boolean)
//     .map((line) => {
//       const [latitude, longitude] = line
//         .split(", ")
//         .map(Number)
//         .map((n) => n.toFixed(4));
//       return { latitude, longitude };
//     });
//   return { locations, otherLocations };
// }
