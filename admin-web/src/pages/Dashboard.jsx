import { useEffect, useState } from 'react';
import {
  Users,
  Car,
  DollarSign,
  Activity,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useDataStore } from '../store/dataStore';

function trendPct(current, previous) {
  if (previous == null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return Math.round(pct * 10) / 10;
}

export default function Dashboard() {
  const { stats, setStats } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [previousPeriod, setPreviousPeriod] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.stats);
      setChartData(response.data.chartData || []);
      setCurrentPeriod(response.data.currentPeriodStats ?? null);
      setPreviousPeriod(response.data.previousPeriodStats ?? null);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cur = currentPeriod;
  const prev = previousPeriod;

  const userTrend = cur && prev ? trendPct(cur.newUsers, prev.newUsers) : null;
  const ridesTrend = cur && prev ? trendPct(cur.totalRides, prev.totalRides) : null;
  const revenueTrend = cur && prev ? trendPct(cur.totalRevenue, prev.totalRevenue) : null;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() ?? '0',
      icon: Users,
      trend: userTrend,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Rides',
      value: stats.activeRides ?? 0,
      icon: Activity,
      trend: ridesTrend,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Total Revenue',
      value: `$${Number(stats.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: revenueTrend,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Pending KYC',
      value: stats.pendingKyc ?? 0,
      icon: AlertCircle,
      trend: null,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  const commission = Number(stats.totalRevenue ?? 0) * 0.2;
  const quickStats = [
    { label: 'Riders', value: stats.totalRiders?.toLocaleString() ?? '0', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Customers', value: stats.totalCustomers?.toLocaleString() ?? '0', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: stats.completedRides?.toLocaleString() ?? '0', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Commission', value: `$${commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-orange-600', bg: 'bg-orange-50' },
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
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Last 7 days vs previous 7 days</p>
        </div>
        <button
          type="button"
          onClick={fetchDashboardData}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
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
            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1 tabular-nums">
              {stat.value}
            </p>
            {stat.trend != null && (
              <p className="text-xs text-slate-400 mt-1">vs previous 7 days</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Rides overview</h2>
          <p className="text-sm text-slate-500 mt-1">Last 7 days</p>
          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ridesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
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
                <Area
                  type="monotone"
                  dataKey="rides"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#ridesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Quick stats</h2>
          <div className="mt-4 space-y-3">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Revenue by day</h2>
        <p className="text-sm text-slate-500 mt-1">Last 7 days</p>
        <div className="mt-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
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
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
