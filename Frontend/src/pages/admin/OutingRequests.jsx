import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const DATE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'particular', label: 'Particular date' },
  { value: 'custom', label: 'Custom date' },
];

function toDateOnly(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AdminOutingRequests() {
  const [outings, setOutings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [tab, setTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [particularDate, setParticularDate] = useState(toDateOnly(new Date()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState(null);
  const [delayHours, setDelayHours] = useState('');

  const getDateParams = () => {
    const today = toDateOnly(new Date());
    const yesterday = toDateOnly(new Date(Date.now() - 864e5));
    if (dateFilter === 'all') return {};
    if (dateFilter === 'today') return { date: today };
    if (dateFilter === 'yesterday') return { date: yesterday };
    if (dateFilter === 'particular' && particularDate) return { date: particularDate };
    if (dateFilter === 'custom' && customFrom && customTo) return { date_from: customFrom, date_to: customTo };
    return {};
  };

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const dateParams = getDateParams();
      const [o, s] = await Promise.all([
        api.get('/outings', { params: { status: tab === 'all' ? undefined : tab, page: p, limit, ...dateParams } }),
        api.get('/outings/stats')
      ]);
      setOutings(o.data?.data ?? []);
      setTotal(o.data.total);
      setTotalPages(o.data.totalPages);
      setStats(s.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [tab, dateFilter, particularDate, customFrom, customTo]);
  useEffect(() => { fetch(page); }, [tab, page, dateFilter, particularDate, customFrom, customTo]);

  const handleApprove = async (id, delay_hours) => {
    try {
      await api.put(`/outings/${id}/approve`, { delay_hours: delay_hours === '' ? undefined : delay_hours });
      toast.success('Outing request approved');
      setApproveModal(null);
      setDelayHours('');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/outings/${id}/reject`);
      toast.success('Outing request rejected');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4">
        <button onClick={() => setTab('all')} className={`px-4 py-2.5 rounded-lg font-medium ${tab === 'all' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Total ({stats.total})</button>
        <button onClick={() => setTab('pending')} className={`px-4 py-2.5 rounded-lg font-medium ${tab === 'pending' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Pending ({stats.pending})</button>
        <button onClick={() => setTab('approved')} className={`px-4 py-2.5 rounded-lg font-medium ${tab === 'approved' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Approved ({stats.approved})</button>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Date filter:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDateFilter(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === f.value
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {dateFilter === 'particular' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Date</label>
            <input
              type="date"
              value={particularDate}
              onChange={(e) => setParticularDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <label className="text-sm text-slate-600">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-sm text-slate-600">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
      {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Regd No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Year/Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Purpose</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">From</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">To</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Room</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status / Delay</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {outings.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{o.regd_no}</td>
                    <td className="px-4 py-3 text-slate-800">{o.student_name}</td>
                    <td className="px-4 py-3 text-slate-700">{o.year ?? '-'}/{o.branch ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{o.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{o.outing_type}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={o.purpose}>{o.purpose || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{new Date(o.from_date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">{new Date(o.to_date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">{o.room_no}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${o.status === 'approved' ? 'bg-green-100 text-green-800' : o.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{o.status}</span>
                      {o.status === 'approved' && o.delay_hours != null && Number(o.delay_hours) > 0 && (
                        <span className="block text-xs text-slate-500 mt-0.5">Delay: {o.delay_hours}h</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => { setApproveModal(o.id); setDelayHours(''); }} className="p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 rounded-lg" title="Approve">Approve</button>
                          <button type="button" onClick={() => handleReject(o.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg" title="Reject">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}
      {approveModal != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Approve outing</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Optional: enter delay in hours before the student may leave (e.g. processing time).</p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Delay (hours)</label>
            <input
              type="number"
              min={0}
              value={delayHours}
              onChange={(e) => setDelayHours(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 mb-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setApproveModal(null); setDelayHours(''); }} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200">Cancel</button>
              <button type="button" onClick={() => handleApprove(approveModal, delayHours)} className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
