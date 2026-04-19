import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  UtensilsCrossed,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';
import RestaurantSelector, { getStoredRestaurantId } from '../components/RestaurantSelector';

const statusLabels = {
  pending: 'New Order',
  restaurant_accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready',
  bidding_open: 'Finding Courier',
  courier_assigned: 'Courier Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusPillClass = {
  pending: 'bg-amber-100 text-amber-800',
  restaurant_accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready_for_pickup: 'bg-emerald-100 text-emerald-800',
  bidding_open: 'bg-slate-100 text-slate-700',
  courier_assigned: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

export default function RestaurantOrders() {
  const [restaurantId, setRestaurantId] = useState(getStoredRestaurantId());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [prepTimeDialog, setPrepTimeDialog] = useState({ open: false, orderId: null });
  const [prepTime, setPrepTime] = useState(25);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      const res = await api.get(`/food-orders/restaurant/${restaurantId}`);
      if (res.data.success) setOrders(res.data.orders || []);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    fetchOrders();
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    socket.emit('joinRoom', `restaurant_${restaurantId}`);
    socket.on('order:new', fetchOrders);
    return () => { socket.disconnect(); };
  }, [restaurantId, fetchOrders]);

  const confirmAcceptOrder = async () => {
    const { orderId } = prepTimeDialog;
    if (!orderId) return;
    setActionLoading(orderId);
    try {
      await api.patch(`/food-orders/${orderId}/restaurant-accept`, {
        preparationTime: Number(prepTime) || 25,
      });
      fetchOrders();
      setPrepTimeDialog({ open: false, orderId: null });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!window.confirm('Reject this order?')) return;
    setActionLoading(orderId);
    try {
      await api.patch(`/food-orders/${orderId}/restaurant-reject`, { reason: 'Restaurant unavailable' });
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/food-orders/${orderId}/ready`);
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const activeStatuses = [
    'pending',
    'restaurant_accepted',
    'preparing',
    'ready_for_pickup',
    'bidding_open',
    'courier_assigned',
  ];
  const completedStatuses = ['picked_up', 'in_transit', 'delivered', 'cancelled'];
  const filteredOrders = orders.filter((o) =>
    activeTab === 'active' ? activeStatuses.includes(o.status) : completedStatuses.includes(o.status)
  );
  const activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;
  const completedCount = orders.filter((o) => completedStatuses.includes(o.status)).length;

  if (!restaurantId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Restaurant Orders</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">Select a restaurant to view orders</p>
          <div className="mt-6 flex justify-center">
            <RestaurantSelector value="" onChange={setRestaurantId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Restaurant Orders</h1>
        <div className="flex items-center gap-3">
          <RestaurantSelector value={restaurantId} onChange={setRestaurantId} />
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          History ({completedCount})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <UtensilsCrossed className="mx-auto text-slate-300" size={48} />
          <p className="mt-4 text-slate-600">
            {activeTab === 'active' ? 'No active orders' : 'No order history'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">#{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusPillClass[order.status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {statusLabels[order.status]}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Items</p>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-slate-600">${Number(item.subtotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-blue-600">${Number(order.pricing?.total || 0).toFixed(2)}</span>
              </div>

              {order.deliveryAddress?.address && (
                <p className="text-sm text-slate-500 mt-2 truncate" title={order.deliveryAddress.address}>
                  {order.deliveryAddress.address}
                </p>
              )}

              {order.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setPrepTimeDialog({ open: true, orderId: order._id }); setPrepTime(25); }}
                    disabled={actionLoading === order._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectOrder(order._id)}
                    disabled={actionLoading === order._id}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl hover:bg-rose-50 disabled:opacity-50"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              )}

              {(order.status === 'restaurant_accepted' || order.status === 'preparing') && (
                <button
                  type="button"
                  onClick={() => handleMarkReady(order._id)}
                  disabled={actionLoading === order._id}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  <Truck size={18} />
                  Mark Ready for Pickup
                </button>
              )}

              {order.status === 'ready_for_pickup' && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                  <Clock size={18} />
                  Waiting for courier pickup
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {prepTimeDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Set Preparation Time</h3>
            <p className="text-sm text-slate-500 mb-4">How long will it take to prepare this order?</p>
            <input
              type="number"
              min={5}
              max={120}
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value) || 25)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900"
            />
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPrepTimeDialog({ open: false, orderId: null })}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAcceptOrder}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                Accept Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
