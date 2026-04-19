import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, DollarSign, Clock, TrendingUp } from 'lucide-react';
import RestaurantSelector, { getStoredRestaurantId, setStoredRestaurantId } from '../components/RestaurantSelector';
import api from '../services/api';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [restaurantId, setRestaurantId] = useState(getStoredRestaurantId());
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    avgPrepTime: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setRestaurant(null);
      setStats({ todayOrders: 0, todayRevenue: 0, avgPrepTime: 0, pendingOrders: 0 });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      api.get(`/restaurants/${restaurantId}`),
      api.get(`/food-orders/restaurant/${restaurantId}?date=${today}`),
    ])
      .then(([restRes, ordersRes]) => {
        if (cancelled) return;
        if (restRes.data.success && restRes.data.restaurant) {
          setRestaurant(restRes.data.restaurant);
        }
        if (ordersRes.data.success) {
          const orders = ordersRes.data.orders || [];
          const pending = orders.filter((o) =>
            ['pending', 'restaurant_accepted', 'preparing'].includes(o.status)
          );
          const revenue = orders
            .filter((o) => o.status === 'delivered')
            .reduce((sum, o) => sum + (o.pricing?.itemsTotal || 0), 0);
          setStats({
            todayOrders: orders.length,
            todayRevenue: revenue,
            avgPrepTime: restRes.data.restaurant?.preparationTime ?? 25,
            pendingOrders: pending.length,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError('Failed to load dashboard');
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [restaurantId]);

  const handleToggleStatus = async () => {
    if (!restaurantId) return;
    try {
      await api.patch(`/restaurants/${restaurantId}/toggle-status`);
      setRestaurant((prev) => (prev ? { ...prev, isOpen: !prev.isOpen } : null));
    } catch (err) {
      console.error(err);
    }
  };

  if (!restaurantId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Restaurant Dashboard</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Store className="mx-auto text-slate-300" size={48} />
          <p className="mt-4 text-slate-600">Select a restaurant to view the dashboard</p>
          <div className="mt-6 flex justify-center">
            <RestaurantSelector value={restaurantId} onChange={(id) => { setStoredRestaurantId(id); setRestaurantId(id); }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Restaurant Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage orders and menu</p>
        </div>
        <div className="flex items-center gap-3">
          <RestaurantSelector value={restaurantId} onChange={setRestaurantId} />
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-slate-700">Open</span>
            <button
              type="button"
              role="switch"
              aria-checked={restaurant?.isOpen ?? false}
              onClick={handleToggleStatus}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                restaurant?.isOpen ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  restaurant?.isOpen ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </label>
          <button
            type="button"
            onClick={() => navigate('/restaurant/orders')}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
          >
            View Orders
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <ShoppingBag size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Today&apos;s Orders</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.todayOrders}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50">
                  <DollarSign size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Today&apos;s Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    ${Number(stats.todayRevenue).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Avg Prep Time</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.avgPrepTime} min</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50">
                  <TrendingUp size={20} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Orders</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/restaurant/orders')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                >
                  <ShoppingBag size={18} />
                  Manage Orders
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/restaurant/menu')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                >
                  <Store size={18} />
                  Edit Menu
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Restaurant Info</h2>
              <dl className="space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        restaurant?.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {restaurant?.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Rating</dt>
                  <dd className="font-medium">{restaurant?.rating != null ? restaurant.rating.toFixed(1) : 'N/A'} ({restaurant?.reviewCount ?? 0} reviews)</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Delivery Fee</dt>
                  <dd className="font-medium">${Number(restaurant?.deliveryFee ?? 0).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Minimum Order</dt>
                  <dd className="font-medium">${Number(restaurant?.minimumOrder ?? 0).toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
