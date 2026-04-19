import { useEffect, useState } from 'react';
import { Search, UserCheck, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

function RoleBadge({ role }) {
  if (role === 'rider') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        <UserCheck size={12} />
        Rider
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <UserIcon size={12} />
      Customer
    </span>
  );
}

function KycBadge({ status }) {
  const styles = {
    pending: { bg: 'bg-slate-100', text: 'text-slate-700' },
    submitted: { bg: 'bg-amber-50', text: 'text-amber-700' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700' },
  };
  const style = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.text.replace('text-', 'bg-')}`} />
      {status == null ? '—' : status.replace(/_/g, ' ')}
    </span>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [filter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users?role=${filter}&page=${page}&limit=20`);
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages ?? 1);
      setTotal(response.data.total ?? 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.kyc?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ratingDisplay = (user) => {
    if (user.role !== 'rider') return '—';
    const r = user.stats?.rating;
    return r != null && typeof r === 'number' ? r.toFixed(1) : 'N/A';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">Manage customers and riders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by phone or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'customer', 'rider'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => { setFilter(role); setPage(1); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === role ? 'bg-blue-50 text-blue-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <UserIcon className="mx-auto text-slate-300" size={48} />
            <p className="mt-4 text-sm font-medium text-slate-600">No users found</p>
            <p className="text-sm text-slate-500">Try a different filter or search</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">KYC</th>
                    <th className="px-4 py-3">Rides</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Earnings</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {user.kyc?.fullName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 tabular-nums">{user.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'rider' ? <KycBadge status={user.kyc?.status} /> : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">{user.stats?.totalRides ?? 0}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">{ratingDisplay(user)}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {user.role === 'rider'
                          ? `$${Number(user.earnings?.available ?? 0).toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">
                  {total} result{total !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
