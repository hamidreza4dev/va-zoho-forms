const ICON_URL = "/assets/images/location.svg";

const mapStyles = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ saturation: 36 }, { color: "#080905" }, { lightness: 40 }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
  },
  {
    featureType: "all",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#fefefe" }, { lightness: 20 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }, { lightness: 20 }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#fefff2" }, { lightness: 21 }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#c5ffaa" }, { lightness: 21 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#647800" }, { lightness: 17 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#d2d683" }, { lightness: 18 }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#eaecc0" }, { lightness: 16 }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c2e1e3" }, { lightness: 17 }],
  },
];

/**
 * @param {HTMLElement} mapElement - ID of the map element
 * @param {{ lat: number; lng: number }} defaultValues - Default values for the map
 * @param {{ onMapClick: (lat: number, lng: number) => void }} listeners - Listeners for the map
 * @param {google.maps.Marker | null} marker - Marker to be placed on the map
 */
function createMap(mapElement, defaultValues, marker = null) {
  if (!"google" in window) return;

  let latVal;
  let lngVal;

  let defaultLocation = new google.maps.LatLng(
    25.079890355516895,
    55.14020919799805
  ); // Default location

  let mapOptions = {
    zoom: 15,
    streetViewControl: false,
    mapTypeControl: false,
    center: defaultLocation,
    styles: mapStyles,
    gestureHandling: "greedy",
    disableDefaultUI: true, // Removes all UI controls (fullscreen, zoom, map type, etc.)
    zoomControl: false, // Disables zoom controls
    fullscreenControl: false, // Disables fullscreen button
    mapTypeControl: false, // Disables map type (satellite/terrain) button
  };

  let map = new google.maps.Map(mapElement, mapOptions);
  mapElement.$map = map;

  if (
    defaultValues.lat !== null &&
    defaultValues.lat !== undefined &&
    defaultValues.lng !== null &&
    defaultValues.lng !== undefined
  ) {
    // Assume serverData is the data received from the server

    let serverData = {
      lat: defaultValues.lat, // Replace with the actual server data
      lng: defaultValues.lng, // Replace with the actual server data
    };

    if (serverData.lat !== "" && serverData.lng !== "") {
      latVal = serverData.lat;
      lngVal = serverData.lng;

      // Set center to the coordinates received from the server
      map.setCenter(new google.maps.LatLng(latVal, lngVal));

      marker = new google.maps.Marker({
        position: new google.maps.LatLng(latVal, lngVal),
        map: map,
        icon: ICON_URL,
      });
    } else {
      // No server data, center to the default location
      map.setCenter(defaultLocation);
    }
  }
}
