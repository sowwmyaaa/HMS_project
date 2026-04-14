import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function AdminRoomAllotment() {
  const [allotments, setAllotments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);
  const [availableRoomNums, setAvailableRoomNums] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target)) setStudentDropdownOpen(false);
    };
    if (modal) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modal]);

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const [a, r, s] = await Promise.all([
        api.get('/room-allotments', { params: { search: search || undefined, page: p, limit } }),
        api.get('/rooms', { params: { limit: 500 } }),
        api.get('/students', { params: { limit: 500 } })
      ]);
      setAllotments(a.data?.data ?? []);
      setTotal(a.data.total);
      setTotalPages(a.data.totalPages);
      setRooms(r.data?.data ?? []);
      setStudents(s.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetch(page); }, [search, page]);

  useEffect(() => {
    if (!modal) return;
    (async () => {
      try {
        const { data } = await api.get('/rooms/availability');
        setAvailableRoomNums((data?.data ?? []).map((x) => x.room_number));
      } catch {
        setAvailableRoomNums([]);
      }
    })();
  }, [modal]);

  const roomSelectList = useMemo(() => {
    const avail = new Set(availableRoomNums);
    const filtered = rooms.filter((r) => avail.has(r.room_number) || r.room_number === form.room_number);
    return filtered.length ? filtered : rooms;
  }, [rooms, availableRoomNums, form.room_number]);

  const handleAdd = () => {
    setModal('add');
    setForm({ room_number: '', regd_no: '', student_name: '' });
    setStudentSearch('');
    setStudentDropdownOpen(false);
  };

  const handleEdit = (a) => {
    setModal('edit');
    setForm({ id: a.id, room_number: a.room_number, regd_no: a.regd_no, student_name: a.student_name });
    setStudentSearch(a.student_name || '');
    setStudentDropdownOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove allotment?')) return;
    try {
      await api.delete(`/room-allotments/${id}`);
      toast.success('Allotment removed successfully');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { room_number: form.room_number, regd_no: form.regd_no, student_name: form.student_name };
      if (modal === 'add') {
        await api.post('/room-allotments', payload);
      } else {
        await api.put(`/room-allotments/${form.id}`, payload);
      }
      setModal(null);
      toast.success(modal === 'add' ? 'Allotment added successfully' : 'Allotment updated successfully');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      studentSearch === '' ||
      (s.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.regd_no || '').toLowerCase().includes(studentSearch.toLowerCase())
  );
  const alreadyAllotted = allotments.map((a) => a.regd_no);
  const selectableStudents = filteredStudents.filter((s) => !alreadyAllotted.includes(s.regd_no) || (form.regd_no === s.regd_no));

  const getVacancy = (room_number) => {
    const room = rooms.find((r) => r.room_number === room_number);
    const count = allotments.filter((a) => a.room_number === room_number).length;
    return room ? `${count}/${room.max_sharing}` : '-';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search by room, registration number, or student name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
        </div>
        <button onClick={handleAdd} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600">Add Allotment</button>
      </div>
      {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Photo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Room No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Regd No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Year/Branch</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vacancy</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allotments.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm overflow-hidden">
                      {a.photo_base64 ? (
                        <img src={a.photo_base64} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (a.student_name || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{a.room_number}</td>
                  <td className="px-4 py-3 text-slate-800">{a.regd_no}</td>
                  <td className="px-4 py-3 text-slate-800">{a.student_name}</td>
                  <td className="px-4 py-3 text-slate-700">{a.year}/{a.branch}</td>
                  <td className="px-4 py-3 text-slate-700">{getVacancy(a.room_number)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(a)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg" title="Edit"><PencilIcon className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg" title="Delete"><TrashIcon className="w-5 h-5" /></button>
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
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{modal === 'add' ? 'Add Allotment' : 'Edit Allotment'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room *</label>
                  <select
                    required
                    value={form.room_number}
                    onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">Select room</option>
                    {roomSelectList.map((r) => (
                      <option key={r.room_number} value={r.room_number}>Room {r.room_number}</option>
                    ))}
                  </select>
                </div>
                <div ref={studentDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student *</label>
                  <div className="relative">
                    <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required={!!form.regd_no}
                      value={form.regd_no ? (students.find((s) => s.regd_no === form.regd_no)?.full_name ?? form.student_name) : studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        if (!e.target.value) setForm({ ...form, regd_no: '', student_name: '' });
                        setStudentDropdownOpen(true);
                      }}
                      onFocus={() => setStudentDropdownOpen(true)}
                      placeholder="Search by name or registration number..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                    {form.regd_no && (
                      <button
                        type="button"
                        onClick={() => { setForm({ ...form, regd_no: '', student_name: '' }); setStudentSearch(''); setStudentDropdownOpen(true); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {studentDropdownOpen && (
                    <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                      {selectableStudents.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-slate-500">No matching students</li>
                      ) : (
                        selectableStudents.map((s) => (
                          <li key={s.regd_no}>
                            <button
                              type="button"
                              onClick={() => {
                                setForm({ ...form, regd_no: s.regd_no, student_name: s.full_name || '' });
                                setStudentSearch('');
                                setStudentDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <span className="font-medium">{s.full_name}</span>
                              <span className="text-slate-500">({s.regd_no})</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                  <input type="hidden" name="regd_no" value={form.regd_no} required readOnly aria-hidden />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg shadow">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
