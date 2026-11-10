import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import '../leafletSetup';
import { listingLatLng } from '../utils/geo';

// Moves the map when the search centre changes. Must be a CHILD of MapContainer to access the map.
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]); // no zoom argument: keeps the user's current zoom level
  }, [map, lat, lng]);
  return null; // renders nothing visible; it only has an effect
}

// Lets the user click the map to choose a new search centre.
function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function ListingMap({ center, radiusKm, listings, onPick }) {
  return (
    // The map needs an explicit height, otherwise it is invisible.
    <MapContainer center={[center.lat, center.lng]} zoom={12} scrollWheelZoom={false}
      className="z-0 h-72 w-full rounded-lg sm:h-96">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} />
      {onPick && <ClickToPick onPick={onPick} />}

      {/* The search area. Circle radius is in METRES. */}
      <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ color: 'green', weight: 1 }} />
      {/* "You are here": a blue dot, so it can't be confused with listing pins */}
      <CircleMarker center={[center.lat, center.lng]} radius={7} pathOptions={{ color: 'blue' }} />

      {listings.map((listing) => (
        // keyboard={false}: pins are NOT Tab stops. The list below the map shows the same listings
        // (with Claim buttons), so keyboard and screen-reader users use the list instead of 15+ pins.
        <Marker key={listing._id} position={listingLatLng(listing)} keyboard={false}>
          <Popup>
            <strong>{listing.title}</strong><br />
            {listing.quantity} meals
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
