import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/workers', { params: { page: p, limit } });
      setWorkers(data?.data ?? []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(page); }, [page]);

  const handleAdd = () => {
    setModal('add');
    setForm({ name: '', phone: '', designation: '', working_timings: '' });
  };

  const handleEdit = (w) => {
    setModal('edit');
    setForm({ ...w });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this worker?')) return;
    try {
      await api.delete(`/workers/${id}`);
      toast.success('Worker deleted');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/workers', form);
        toast.success('Worker added successfully');
      } else {
        await api.put(`/workers/${form.id}`, form);
        toast.success('Worker updated successfully');
      }
      setModal(null);
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <button onClick={handleAdd} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600">Add Worker</button>
      </div>
      {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Designation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Working Timings</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{w.name}</td>
                    <td className="px-4 py-3 text-slate-700">{w.phone}</td>
                    <td className="px-4 py-3 text-slate-700">{w.designation}</td>
                    <td className="px-4 py-3 text-slate-700">{w.working_timings}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(w)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg" title="Edit"><PencilIcon className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(w.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}
      {modal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">{modal === 'add' ? 'Add Worker' : 'Edit Worker'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {['name','phone','designation','working_timings'].map((k) => (
                  <div key={k}>
                    <label className="block text-sm font-medium mb-1">{k.replace(/_/g, ' ')}</label>
                    <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full border rounded px-3 py-2" />
                  </div>
                ))}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-hostel-primary text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
