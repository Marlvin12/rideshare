import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pickupIcon = new L.DivIcon({
  className: 'ride-marker pickup',
  html: '<span style="background:#059669;width:12px;height:12px;border-radius:50%;display:block;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});
const dropIcon = new L.DivIcon({
  className: 'ride-marker drop',
  html: '<span style="background:#dc2626;width:12px;height:12px;border-radius:50%;display:block;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, points]);

  return null;
}

function RideMarkers({ rides }) {
  const points = useMemo(() => {
    const out = [];
    rides.forEach((ride) => {
      if (ride.pickup?.latitude != null && ride.pickup?.longitude != null) {
        out.push([ride.pickup.latitude, ride.pickup.longitude]);
      }
      if (ride.drop?.latitude != null && ride.drop?.longitude != null) {
        out.push([ride.drop.latitude, ride.drop.longitude]);
      }
    });
    return out;
  }, [rides]);

  const validRides = useMemo(
    () =>
      rides.filter(
        (r) =>
          r.pickup?.latitude != null &&
          r.pickup?.longitude != null &&
          r.drop?.latitude != null &&
          r.drop?.longitude != null
      ),
    [rides]
  );

  return (
    <>
      <FitBounds points={points} />
      {validRides.map((ride) => (
        <Polyline
          key={ride._id}
          positions={[
            [ride.pickup.latitude, ride.pickup.longitude],
            [ride.drop.latitude, ride.drop.longitude],
          ]}
          pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.7 }}
        />
      ))}
      {validRides.map((ride) => (
        <Marker
          key={`${ride._id}-pickup`}
          position={[ride.pickup.latitude, ride.pickup.longitude]}
          icon={pickupIcon}
        >
          <Popup>
            <span className="font-medium text-emerald-700">Pickup</span>
            <br />
            {ride.pickup?.address || '—'}
            <br />
            <span className="text-xs text-slate-500">{ride.status}</span>
          </Popup>
        </Marker>
      ))}
      {validRides.map((ride) => (
        <Marker
          key={`${ride._id}-drop`}
          position={[ride.drop.latitude, ride.drop.longitude]}
          icon={dropIcon}
        >
          <Popup>
            <span className="font-medium text-rose-700">Drop-off</span>
            <br />
            {ride.drop?.address || '—'}
            <br />
            <span className="text-xs text-slate-500">{ride.status}</span>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function RidesMap({ rides, className = '' }) {
  const hasValidRides = useMemo(
    () =>
      rides.some(
        (r) =>
          r.pickup?.latitude != null &&
          r.pickup?.longitude != null &&
          r.drop?.latitude != null &&
          r.drop?.longitude != null
      ),
    [rides]
  );

  if (!hasValidRides) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 ${className}`}
        style={{ minHeight: 320 }}
      >
        <p className="text-sm">No rides with location data to show on map</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 overflow-hidden bg-white ${className}`}>
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow" />
          Pickup
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow" />
          Drop-off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-500 rounded" />
          Route
        </span>
      </div>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-[320px] z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RideMarkers rides={rides} />
      </MapContainer>
    </div>
  );
}
