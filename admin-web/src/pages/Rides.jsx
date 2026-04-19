import { useEffect, useState, lazy, Suspense, Component } from 'react';
import { Car, MapPin, ChevronDown, ChevronRight, DollarSign, Clock, Users as UsersIcon } from 'lucide-react';
import api from '../services/api';

const RidesMap = lazy(() => import('../components/RidesMap'));

class MapErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[320px] flex items-center justify-center bg-slate-50 text-slate-600 text-sm rounded-2xl border border-slate-200">
          Map unavailable. Refresh the page to retry.
        </div>
      );
    }
    return this.props.children;
  }
}

const STATUS_STYLES = {
  AWAITING_OFFERS: 'bg-amber-50 text-amber-700',
  SEARCHING_FOR_RIDER: 'bg-blue-50 text-blue-700',
  START: 'bg-emerald-50 text-emerald-700',
  ARRIVED: 'bg-purple-50 text-purple-700',
  COMPLETED: 'bg-slate-100 text-slate-700',
};

const VEHICLE_LABELS = {
  bike: 'Bike',
  human: 'Human',
  cabEconomy: 'Cab Economy',
  cabPremium: 'Cab Premium',
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.SEARCHING_FOR_RIDER;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status?.replace(/_/g, ' ') ?? '—'}
    </span>
  );
}

function RideRow({ ride, expanded, onToggle }) {
  const vehicleLabel = VEHICLE_LABELS[ride.vehicle] || ride.vehicle;

  return (
    <>
      <tr
        className="hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <span className="font-medium text-slate-900">{vehicleLabel}</span>
        </td>
        <td className="px-4 py-3">
          <StatusPill status={ride.status} />
        </td>
        <td className="px-4 py-3 text-sm tabular-nums font-medium">
          ${Number(ride.fare ?? 0).toFixed(2)}
        </td>
        <td className="px-4 py-3 text-sm tabular-nums">{Number(ride.distance ?? 0).toFixed(1)} km</td>
        <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate" title={ride.pickup?.address}>
          {ride.pickup?.address || '—'}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate" title={ride.drop?.address}>
          {ride.drop?.address || '—'}
        </td>
        <td className="px-4 py-3 text-xs text-slate-500">
          {ride.createdAt ? new Date(ride.createdAt).toLocaleString() : '—'}
        </td>
        <td className="px-4 py-3">
          {expanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <MapPin size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Pickup</p>
                    <p className="text-slate-700">{ride.pickup?.address || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Drop-off</p>
                    <p className="text-slate-700">{ride.drop?.address || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-slate-400" />
                  <span className="text-slate-500">Pricing:</span>
                  <span className="font-medium">{ride.pricingModel === 'bidding' ? 'Bidding' : 'Fixed'}</span>
                  {ride.pricingModel === 'bidding' && (
                    <span className="text-slate-600">Proposed ${Number(ride.proposedPrice ?? 0).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon size={16} className="text-slate-400" />
                  <span className="text-slate-500">Offers:</span>
                  <span className="font-medium">{ride.offers?.length ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-medium">{ride.customer?.kyc?.fullName || ride.customer?.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Rider:</span>
                  <span className="font-medium">{ride.rider?.kyc?.fullName || ride.rider?.phone || 'Not assigned'}</span>
                </div>
                {ride.offers?.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Offers</p>
                    <div className="flex flex-wrap gap-2">
                      {ride.offers.slice(0, 5).map((offer, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 text-slate-700">
                          {offer.riderId?.kyc?.fullName || offer.riderId?.phone || 'Unknown'} — ${Number(offer.offeredPrice ?? 0).toFixed(2)}
                        </span>
                      ))}
                      {ride.offers.length > 5 && (
                        <span className="text-slate-500 text-xs">+{ride.offers.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRides();
  }, [filter]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/rides?status=${filter}`);
      setRides(response.data.rides ?? []);
    } catch (error) {
      console.error('Failed to fetch rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'AWAITING_OFFERS', label: 'Awaiting Offers' },
    { value: 'START', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Rides</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor and manage rides</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === option.value ? 'bg-blue-50 text-blue-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <MapErrorBoundary>
        <div className="mb-6 min-h-[320px] rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <Suspense
            fallback={
              <div className="h-[320px] flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
                Loading map…
              </div>
            }
          >
            <RidesMap rides={rides} className="" />
          </Suspense>
        </div>
      </MapErrorBoundary>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : rides.length === 0 ? (
          <div className="py-16 text-center">
            <Car className="mx-auto text-slate-300" size={48} />
            <p className="mt-4 text-sm font-medium text-slate-600">No rides found</p>
            <p className="text-sm text-slate-500">Try a different filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Drop</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.map((ride) => (
                  <RideRow
                    key={ride._id}
                    ride={ride}
                    expanded={expandedId === ride._id}
                    onToggle={() => setExpandedId(expandedId === ride._id ? null : ride._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
