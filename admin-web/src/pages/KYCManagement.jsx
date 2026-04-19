import { useEffect, useState } from 'react';
import { Check, X, Eye, FileText, Calendar, AlertCircle, MapPin } from 'lucide-react';
import api from '../services/api';

const STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-700',
  submitted: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status == null ? '—' : status.replace(/_/g, ' ')}
    </span>
  );
}

export default function KYCManagement() {
  const [submissions, setSubmissions] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ submitted: 0, approved: 0, rejected: 0, not_submitted: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('submitted');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchKYC();
  }, [filter]);

  const fetchKYC = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/kyc?status=${filter}`);
      setSubmissions(response.data.submissions ?? []);
      setStatusCounts(response.data.statusCounts ?? { submitted: 0, approved: 0, rejected: 0, not_submitted: 0 });
    } catch (error) {
      console.error('Failed to fetch KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.post('/kyc/approve', { userId });
      fetchKYC();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId) => {
    if (!rejectReason.trim()) return;
    try {
      await api.post('/kyc/reject', { userId, reason: rejectReason });
      setModalOpen(false);
      setRejectReason('');
      setSelectedKyc(null);
      fetchKYC();
    } catch (err) {
      console.error(err);
    }
  };

  const viewDocument = (imageData) => {
    if (!imageData) return;
    const w = window.open();
    w.document.write(`<img src="${imageData}" alt="ID" style="max-width:100%;height:auto;" />`);
  };

  const tabs = [
    { value: 'submitted', label: 'Pending Review', count: statusCounts.submitted },
    { value: 'approved', label: 'Approved', count: statusCounts.approved },
    { value: 'rejected', label: 'Rejected', count: statusCounts.rejected },
    { value: 'pending', label: 'Not Submitted', count: statusCounts.not_submitted },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">KYC Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review and verify rider identity documents</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
              filter === tab.value ? 'bg-blue-50 text-blue-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className="tabular-nums">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="mx-auto text-slate-300" size={48} />
            <p className="mt-4 text-sm font-medium text-slate-600">No submissions found</p>
            <p className="text-sm text-slate-500">Status: {filter}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">ID Type</th>
                  <th className="px-4 py-3">ID Number</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Documents</th>
                  {filter === 'submitted' && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{sub.kyc?.fullName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 tabular-nums">{sub.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{sub.kyc?.idType?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{sub.kyc?.idNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {sub.kyc?.submittedAt ? new Date(sub.kyc.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.kyc?.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => viewDocument(sub.kyc?.idFrontImage)}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Front
                        </button>
                        {sub.kyc?.idBackImage && (
                          <button
                            type="button"
                            onClick={() => viewDocument(sub.kyc.idBackImage)}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            Back
                          </button>
                        )}
                      </div>
                    </td>
                    {filter === 'submitted' && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(sub._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedKyc(sub); setModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && selectedKyc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Reject KYC</h3>
            <p className="text-sm text-slate-600 mt-2">
              Reason for rejecting <span className="font-medium">{selectedKyc.kyc?.fullName}</span>:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-3 w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => handleReject(selectedKyc._id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
              >
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setRejectReason(''); setSelectedKyc(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
