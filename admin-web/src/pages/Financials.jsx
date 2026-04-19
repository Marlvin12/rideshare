import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Wallet, CreditCard, ArrowUp, ArrowDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

function trendPct(current, previous) {
  if (previous == null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return Math.round(pct * 10) / 10;
}

export default function Financials() {
  const [data, setData] = useState({
    totalRevenue: 0,
    platformFees: 0,
    riderEarnings: 0,
    transactions: [],
    revenueByVehicle: [],
    monthlyRevenue: [],
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/financials');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueTrend = trendPct(data.currentMonthRevenue, data.previousMonthRevenue);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${Number(data.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: revenueTrend,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Platform Fees',
      subtitle: '20%',
      value: `$${Number(data.platformFees).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      trend: revenueTrend,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Rider Earnings',
      subtitle: '80%',
      value: `$${Number(data.riderEarnings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      trend: revenueTrend,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Transactions',
      value: data.transactions?.length ?? 0,
      icon: CreditCard,
      trend: null,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Financials</h1>
          <p className="text-sm text-slate-500 mt-1">Revenue, fees, and transactions</p>
        </div>
        <button
          type="button"
          onClick={fetchFinancialData}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                <stat.icon size={20} className={stat.iconColor} />
              </div>
              {stat.trend != null && (
                <span
                  className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                    stat.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {stat.trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {stat.trend >= 0 ? '+' : ''}
                  {stat.trend}%
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 mt-4">{stat.title}</p>
            {stat.subtitle && <p className="text-xs text-slate-400">{stat.subtitle}</p>}
            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1 tabular-nums">
              {stat.value}
            </p>
            {stat.trend != null && (
              <p className="text-xs text-slate-400 mt-1">vs previous month</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Monthly revenue</h2>
          <p className="text-sm text-slate-500 mt-1">Last 6 months</p>
          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyRevenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
                <Bar dataKey="platformFee" fill="#8b5cf6" name="Platform Fee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Revenue by vehicle</h2>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.revenueByVehicle ?? []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {(data.revenueByVehicle ?? []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(data.revenueByVehicle ?? []).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-slate-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">Recent transactions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Latest completed rides</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Ride ID</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Fare</th>
                <th className="px-4 py-3">Platform Fee</th>
                <th className="px-4 py-3">Rider Earning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.transactions ?? []).slice(0, 20).map((tx, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {tx.date ? new Date(tx.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {tx.rideId ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">{tx.vehicle ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium tabular-nums">
                    ${Number(tx.fare ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-purple-600">
                    ${Number(tx.platformFee ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-emerald-600">
                    ${Number(tx.riderEarning ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
