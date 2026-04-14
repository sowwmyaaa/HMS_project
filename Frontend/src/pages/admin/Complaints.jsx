import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import Pagination from '../../components/Pagination';

function formatComplaintWhen(c) {
  const raw = c.created_at || c.complaint_date;
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, solved: 0 });
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api.get('/complaints', { params: { status: tab === 'all' ? undefined : tab, page: p, limit } }),
        api.get('/complaints/stats')
      ]);
      setComplaints(c.data?.data ?? []);
      setTotal(c.data.total);
      setTotalPages(c.data.totalPages);
      setStats(s.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { fetch(page); }, [tab, page]);

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status });
      toast.success('Complaint marked as solved');
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
        <button onClick={() => setTab('solved')} className={`px-4 py-2.5 rounded-lg font-medium ${tab === 'solved' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Solved ({stats.solved})</button>
      </div>
      {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Room No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Problem</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">{c.room_no}</td>
                  <td className="px-4 py-3 text-slate-800">{c.student_name}</td>
                  <td className="px-4 py-3 text-slate-700">{c.problem}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatComplaintWhen(c)}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${c.status === 'solved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{c.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'pending' && (
                      <button onClick={() => handleStatus(c.id, 'solved')} className="text-blue-600 hover:text-blue-700 font-medium">Mark Solved</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
