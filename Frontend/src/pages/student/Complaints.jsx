import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function StudentComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ problem: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/complaints/student/${user.regd_no}`, { params: { page: p, limit } });
      setComplaints(data?.data ?? []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(page); }, [user.regd_no, page]);

  useEffect(() => {
    if (!user?.regd_no) return;
    api
      .get('/students/me')
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(null));
  }, [user?.regd_no]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setDone(false);
    try {
      await api.post('/complaints', { problem: form.problem });
      setDone(true);
      toast.success('Complaint submitted successfully');
      setForm({ problem: '' });
      fetch(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'solved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
          <CheckCircleIcon className="w-4 h-4" />
          Solved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        <ClockIcon className="w-4 h-4" />
        Pending
      </span>
    );
  };

  const formatWhen = (c) => {
    const raw = c.created_at || c.complaint_date;
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
            Lodge a Complaint
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Your name and room are filled in automatically from your hostel records. Describe the issue below.
          </p>
        </div>

        <div className="p-6">
          {(profile || user) && (
            <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Will be sent with your complaint</p>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-800 dark:text-slate-200">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 text-xs">Student name</dt>
                  <dd className="font-medium">{profile?.full_name || user?.full_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 text-xs">Registration no.</dt>
                  <dd className="font-medium">{user?.regd_no || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 text-xs">Room number</dt>
                  <dd className="font-medium">{profile?.current_room || '—'}</dd>
                </div>
              </dl>
            </div>
          )}
          {done && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 dark:text-green-300 font-medium">Complaint Submitted Successfully</p>
                <p className="text-sm text-green-600 dark:text-green-400">Your complaint has been recorded and will be reviewed.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                Problem description *
              </label>
              <textarea
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                rows={4}
                required
                placeholder="Describe the problem in detail..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Submit Complaint
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            Your Complaint History
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Track the status of your submitted complaints</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Problem</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4" />
                        Date
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{c.room_no || '—'}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{c.problem}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">{formatWhen(c)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(c.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!complaints.length && (
                <div className="text-center py-12 text-slate-500">No complaints yet</div>
              )}
              {complaints.length > 0 && (
                <div className="mt-4">
                  <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
