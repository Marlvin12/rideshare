import { useState, useEffect } from 'react';
import { Store, ChevronDown } from 'lucide-react';
import api from '../services/api';

const STORAGE_KEY = 'adminSelectedRestaurantId';

export function getStoredRestaurantId() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setStoredRestaurantId(id) {
  if (id) localStorage.setItem(STORAGE_KEY, id);
  else localStorage.removeItem(STORAGE_KEY);
}

export default function RestaurantSelector({ value, onChange, className = '' }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/restaurants?limit=100')
      .then((res) => {
        if (!cancelled && res.data.success) {
          setRestaurants(res.data.restaurants || []);
          if (!value && res.data.restaurants?.length > 0) {
            const firstId = res.data.restaurants[0]._id;
            onChange(firstId);
            setStoredRestaurantId(firstId);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [value, onChange]);

  const selected = restaurants.find((r) => r._id === value);
  const displayName = selected?.name || (value ? 'Loading…' : 'Select restaurant');

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 min-w-[200px]"
      >
        <Store size={18} className="text-slate-500" />
        <span className="truncate flex-1 text-left">{displayName}</span>
        <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
      </button>
      {open && (
        <>
          <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-auto">
            {restaurants.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">No restaurants found</p>
            ) : (
              restaurants.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => {
                    onChange(r._id);
                    setStoredRestaurantId(r._id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${value === r._id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                >
                  {r.name}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
        </>
      )}
    </div>
  );
}
