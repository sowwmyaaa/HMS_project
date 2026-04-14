import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import Pagination from '../../components/Pagination';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function AdminDoctor() {
  const [schedule, setSchedule] = useState([]);
  const [visits, setVisits] = useState([]);
  const [todayAvailable, setTodayAvailable] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [form, setForm] = useState({ regd_no: '', student_name: '', room_no: '', year_branch: '', reason: '', prescription: '', visit_date: new Date().toISOString().slice(0, 10), visit_time: '10:00', phone: '' });
  const [scheduleForm, setScheduleForm] = useState({});
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const [s, v, t] = await Promise.all([
        api.get('/doctor/schedule'),
        api.get('/doctor/visits', { params: { page: p, limit } }),
        api.get('/doctor/today')
      ]);
      setSchedule(s.data);
      setVisits(v.data?.data ?? []);
      setTotal(v.data.total);
      setTotalPages(v.data.totalPages);
      setTodayAvailable(t.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(page); }, [page]);
  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    const f = async () => {
      try {
        const { data } = await api.get('/students', { params: { limit: 500 } });
        setStudents(data?.data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    if (modal === 'add') f();
  }, [modal]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target)) setStudentDropdownOpen(false);
    };
    if (modal) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modal]);

  const filteredVisits = visits.filter(
    (v) =>
      !search ||
      (v.regd_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.room_no || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalVisits = visits.length;
  const todayVisits = visits.filter((v) => v.visit_date === new Date().toISOString().slice(0, 10)).length;
  const availableDays = schedule.filter((s) => s.available).length;

  const handleAdd = () => {
    setModal('add');
    setForm({ regd_no: '', student_name: '', room_no: '', year_branch: '', reason: '', prescription: '', visit_date: new Date().toISOString().slice(0, 10), visit_time: '10:00', phone: '' });
    setStudentSearch('');
    setStudentDropdownOpen(false);
  };

  const handleEdit = (v) => {
    setModal('edit');
    setForm({ ...v });
    setStudentSearch('');
    setStudentDropdownOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this visit record?')) return;
    try {
      await api.delete(`/doctor/visits/${id}`);
      toast.success('Visit record deleted');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const handleScheduleEdit = (s) => {
    setScheduleModal(s);
    setScheduleForm({ available: s.available, time_slot: s.time_slot || '' });
  };

  const handleScheduleSave = async () => {
    if (!scheduleModal) return;
    try {
      await api.put(`/doctor/schedule/${scheduleModal.id}`, scheduleForm);
      toast.success('Schedule updated');
      setScheduleModal(null);
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/doctor/visits', form);
        toast.success('Doctor visit recorded');
      } else {
        await api.put(`/doctor/visits/${form.id}`, form);
        toast.success('Visit record updated');
      }
      setModal(null);
      setForm({ regd_no: '', student_name: '', room_no: '', year_branch: '', reason: '', prescription: '', visit_date: new Date().toISOString().slice(0, 10), visit_time: '10:00', phone: '' });
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Doctor Availability</h2>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${todayAvailable?.available ? 'bg-green-100' : 'bg-red-100'}`}>
              {todayAvailable?.available ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500">Today's Status</p>
              <p className={`text-lg font-semibold ${todayAvailable?.available ? 'text-green-600' : 'text-red-600'}`}>
                {todayAvailable?.available ? 'Available' : 'Not Available'}
              </p>
              {todayAvailable?.time_slot && (
                <p className="text-xs text-slate-500 mt-0.5">{todayAvailable.time_slot}</p>
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <HeartIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalVisits}</p>
              <p className="text-sm text-slate-500">Total Visits</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{todayVisits}</p>
              <p className="text-sm text-slate-500">Today's Visits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Doctor Visit Attendance</h3>
            <p className="text-sm text-slate-500 mt-0.5">Record and manage doctor visits</p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Add Visit
          </button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by regd no, name, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Regd No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Year/Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Room</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Prescription</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                        <span>{v.visit_date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <ClockIcon className="w-3 h-3" />
                        <span>{v.visit_time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{v.regd_no}</td>
                    <td className="px-4 py-3 text-slate-800">{v.student_name}</td>
                    <td className="px-4 py-3 text-slate-700">{v.year_branch || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{v.room_no || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{v.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={v.reason}>{v.reason || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={v.prescription}>{v.prescription || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(v)}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVisits.length === 0 && (
              <p className="p-6 text-center text-slate-500">No visits found.</p>
            )}
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Weekly Schedule</h3>
            <p className="text-sm text-slate-500 mt-0.5">Edit doctor availability for each day</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Available</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Time Slot</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800 font-medium">{s.day_name}</td>
                  <td className="px-4 py-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={s.available || false}
                        onChange={async () => {
                          try {
                            await api.put(`/doctor/schedule/${s.id}`, { available: !s.available, time_slot: s.time_slot || '' });
                            toast.success('Schedule updated');
                            fetch(page);
                          } catch (e) {
                            toast.error(e.response?.data?.error || 'Failed');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm text-slate-700">{s.available ? 'Available' : 'Not Available'}</span>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    {scheduleModal?.id === s.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={scheduleForm.time_slot || ''}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, time_slot: e.target.value })}
                          placeholder="e.g., 9:00 AM - 12:00 PM"
                          className="border border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 w-48"
                          autoFocus
                          onBlur={handleScheduleSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleScheduleSave();
                            } else if (e.key === 'Escape') {
                              setScheduleModal(null);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700">{s.time_slot || '-'}</span>
                        <button
                          onClick={() => handleScheduleEdit(s)}
                          className="p-1 text-slate-400 hover:text-amber-600"
                          title="Edit time slot"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleScheduleEdit(s)}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                      title="Edit Schedule"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit Schedule - {scheduleModal.day_name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Available</label>
                <select
                  value={scheduleForm.available ? 'true' : 'false'}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, available: e.target.value === 'true' })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot</label>
                <input
                  type="text"
                  value={scheduleForm.time_slot || ''}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time_slot: e.target.value })}
                  placeholder="e.g., 9:00 AM - 12:00 PM"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModal(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleSave}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg shadow"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{modal === 'add' ? 'Add Doctor Visit' : 'Edit Doctor Visit'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modal === 'add' ? (
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
                        if (!e.target.value) setForm({ ...form, regd_no: '', student_name: '', room_no: '', year_branch: '' });
                        setStudentDropdownOpen(true);
                      }}
                      onFocus={() => setStudentDropdownOpen(true)}
                      placeholder="Search by name or registration number..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                    {form.regd_no && (
                      <button
                        type="button"
                        onClick={() => { setForm({ ...form, regd_no: '', student_name: '', room_no: '', year_branch: '' }); setStudentSearch(''); setStudentDropdownOpen(true); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {studentDropdownOpen && (
                    <ul className="absolute z-10 w-full mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                      {students
                        .filter(
                          (s) =>
                            !studentSearch ||
                            (s.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                            (s.regd_no || '').toLowerCase().includes(studentSearch.toLowerCase())
                        )
                        .length === 0 ? (
                        <li className="px-3 py-2 text-sm text-slate-500">No students found</li>
                      ) : (
                        students
                          .filter(
                            (s) =>
                              !studentSearch ||
                              (s.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                              (s.regd_no || '').toLowerCase().includes(studentSearch.toLowerCase())
                          )
                          .map((s) => (
                            <li key={s.regd_no}>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const { data } = await api.get('/room-allotments', { params: { limit: 500 } });
                                    const allotment = data?.data?.find((a) => a.regd_no === s.regd_no);
                                    setForm({
                                      ...form,
                                      regd_no: s.regd_no,
                                      student_name: s.full_name || '',
                                      room_no: allotment?.room_number || '',
                                      year_branch: `${s.year || ''}/${s.branch || ''}`,
                                    });
                                    setStudentSearch('');
                                    setStudentDropdownOpen(false);
                                  } catch (e) {
                                    console.error(e);
                                    setForm({ ...form, regd_no: s.regd_no, student_name: s.full_name || '', room_no: '', year_branch: `${s.year || ''}/${s.branch || ''}` });
                                    setStudentSearch('');
                                    setStudentDropdownOpen(false);
                                  }
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
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Regd No</label>
                    <input type="text" value={form.regd_no || ''} readOnly className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                    <input type="text" value={form.student_name || ''} readOnly className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-600" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room No</label>
                  <input
                    type="text"
                    value={form.room_no || ''}
                    onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year/Branch</label>
                  <input
                    type="text"
                    value={form.year_branch || ''}
                    onChange={(e) => setForm({ ...form, year_branch: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visit Date *</label>
                  <input
                    type="date"
                    value={form.visit_date || ''}
                    onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visit Time *</label>
                  <input
                    type="time"
                    value={form.visit_time || ''}
                    onChange={(e) => setForm({ ...form, visit_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea
                  value={form.reason || ''}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prescription</label>
                <textarea
                  value={form.prescription || ''}
                  onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setModal(null); setForm({ regd_no: '', student_name: '', room_no: '', year_branch: '', reason: '', prescription: '', visit_date: new Date().toISOString().slice(0, 10), visit_time: '10:00', phone: '' }); }}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg shadow">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
