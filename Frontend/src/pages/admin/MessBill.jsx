import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import Pagination from '../../components/Pagination';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function AdminMessBill() {
  const [bills, setBills] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]}-${now.getFullYear()}`;
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);
  const reportRef = useRef(null);

  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = -6; i <= 12; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const year = date.getFullYear();
      const month = months[date.getMonth()];
      options.push(`${month}-${year}`);
    }
    return options;
  };

  const monthYearOptions = generateMonthYearOptions();

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const params = { month_year: monthYear, page: p, limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await api.get('/mess-bills', { params });
      setBills(data?.data ?? []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /** Full month totals for summary cards (ignore status filter) */
  const fetchAllBills = async () => {
    try {
      const { data } = await api.get('/mess-bills', { params: { month_year: monthYear, limit: 5000, page: 1 } });
      setAllBills(data?.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { setPage(1); }, [monthYear, search, statusFilter]);
  useEffect(() => { fetch(page); }, [monthYear, page, statusFilter]);
  useEffect(() => { fetchAllBills(); }, [monthYear]);

  useEffect(() => {
    const f = async () => {
      try {
        const { data } = await api.get('/mess-bills', { params: { month_year: monthYear, limit: 1000 } });
        setStudents(data?.data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    if (modal === 'add') f();
  }, [modal]);

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

  const normStatus = (b) => String(b.payment_status || b.status || 'unpaid').toLowerCase();

  const filteredBills = bills.filter(
    (b) =>
      !search ||
      (b.regd_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.room_no || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = allBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const paidAmount = allBills.filter((b) => normStatus(b) === 'paid').reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const unpaidAmount = allBills.filter((b) => normStatus(b) === 'unpaid').reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const PER_DAY_RATE = 115;

  const handleAdd = () => {
    setModal('add');
    setForm({ regd_no: '', student_name: '', room_no: '', month_year: monthYear, staying_days: 0, mess_amount: 0, old_due: 0, fine: 0, total_amount: 0, remarks: '', status: 'unpaid' });
    setStudentSearch('');
    setStudentDropdownOpen(false);
  };

  const handleEdit = (b) => {
    setModal('edit');
    setForm({ ...b, status: b.payment_status || b.status || 'unpaid' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bill?')) return;
    try {
      await api.delete(`/mess-bills/${id}`);
      toast.success('Mess bill deleted');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        const total = (parseFloat(form.mess_amount) || 0) + (parseFloat(form.old_due) || 0) + (parseFloat(form.fine) || 0);
        await api.post('/mess-bills', { ...form, total_amount: total });
      } else {
        const total = (parseFloat(form.mess_amount) || 0) + (parseFloat(form.old_due) || 0) + (parseFloat(form.fine) || 0);
        await api.put(`/mess-bills/${form.id}`, { ...form, total_amount: total });
      }
      setModal(null);
      toast.success(modal === 'add' ? 'Mess bill added' : 'Mess bill updated');
      fetch(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const loadExportRows = async () => {
    const params = { month_year: monthYear, limit: 5000, page: 1 };
    if (statusFilter !== 'all') params.status = statusFilter;
    const { data } = await api.get('/mess-bills', { params });
    let rows = data?.data ?? [];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (b) =>
          (b.regd_no || '').toLowerCase().includes(q) ||
          (b.student_name || '').toLowerCase().includes(q) ||
          (b.room_no || '').toLowerCase().includes(q)
      );
    }
    return rows;
  };

  const handlePrint = async () => {
    try {
      const exportRows = await loadExportRows();
      const sum = exportRows.reduce((s, b) => s + (parseFloat(b.total_amount) || 0), 0);
      const win = window.open('', '_blank');
      win.document.write(`
      <!DOCTYPE html><html><head><title>Mess Bill Report - ${monthYear}</title>
      <style>body{font-family:sans-serif;padding:16px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;} .text-right{text-align:right;}</style>
      </head><body>
      <h1>Mess Bill Details - ${monthYear}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table>
      <thead><tr><th>Reg. No</th><th>Student Name</th><th>Room</th><th class="text-right">Days Present</th><th class="text-right">Per Day (₹)</th><th class="text-right">Total Amount (₹)</th><th>Status</th></tr></thead>
      <tbody>
      ${exportRows.map((b) => `<tr><td>${b.regd_no}</td><td>${b.student_name || ''}</td><td>${b.room_no || '-'}</td><td class="text-right">${b.staying_days || 0}</td><td class="text-right">${PER_DAY_RATE}</td><td class="text-right">₹${b.total_amount || 0}</td><td>${normStatus(b) === 'paid' ? 'Paid' : 'Unpaid'}</td></tr>`).join('')}
      </tbody>
      <tfoot><tr><td colspan="5"><strong>Total</strong></td><td class="text-right"><strong>₹${sum.toFixed(2)}</strong></td><td></td></tr></tfoot>
      </table></body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 250);
    } catch (e) {
      toast.error('Could not prepare print');
    }
  };

  const handleCSV = async () => {
    try {
      const exportRows = await loadExportRows();
      const headers = ['Reg. No', 'Student Name', 'Room', 'Days Present', 'Per Day (₹)', 'Total Amount (₹)', 'Status'];
      const rows = exportRows.map((b) => [
        b.regd_no,
        `"${(b.student_name || '').replace(/"/g, '""')}"`,
        b.room_no || '',
        b.staying_days || 0,
        PER_DAY_RATE,
        b.total_amount || 0,
        normStatus(b) === 'paid' ? 'Paid' : 'Unpaid',
      ]);
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mess-bills-${monthYear}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Exported ${exportRows.length} row(s)`);
    } catch (e) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mess Bill Details</h2>
              <p className="text-sm text-slate-500 mt-0.5">Monthly mess bill calculations (₹{PER_DAY_RATE}/day)</p>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Add Bill
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Reg. Number or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-slate-500" />
              <select
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg w-48 focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                {monthYearOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-slate-800">₹{totalAmount.toFixed(2)}</p>
              </div>
              <CurrencyDollarIcon className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Paid Amount</p>
                <p className="text-2xl font-bold text-slate-800">₹{paidAmount.toFixed(2)}</p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Unpaid Amount</p>
                <p className="text-2xl font-bold text-slate-800">₹{unpaidAmount.toFixed(2)}</p>
              </div>
              <XCircleIcon className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto" ref={reportRef}>
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Reg. No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Days Present</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Per Day (₹)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Amount (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredBills.map((b) => {
                  const paymentStatus = normStatus(b);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-medium">{b.regd_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900">{b.student_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{b.room_no || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-slate-700">{b.staying_days || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-slate-700">₹{PER_DAY_RATE}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-900">₹{parseFloat(b.total_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-4 h-4" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="w-4 h-4" />
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(b)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBills.length === 0 && (
              <p className="p-6 text-center text-slate-500">No bills found for the selected filters.</p>
            )}
            <div className="p-4">
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{modal === 'add' ? 'Add Mess Bill' : 'Edit Mess Bill'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modal === 'add' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Month Year *</label>
                    <select
                      value={form.month_year || monthYear}
                      onChange={(e) => setForm({ ...form, month_year: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                      required
                    >
                      {monthYearOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
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
                          if (!e.target.value) setForm({ ...form, regd_no: '', student_name: '', room_no: '' });
                          setStudentDropdownOpen(true);
                        }}
                        onFocus={() => setStudentDropdownOpen(true)}
                        placeholder="Search by name or registration number..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                      />
                      {form.regd_no && (
                        <button
                          type="button"
                          onClick={() => { setForm({ ...form, regd_no: '', student_name: '', room_no: '' }); setStudentSearch(''); setStudentDropdownOpen(true); }}
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
                                      });
                                      setStudentSearch('');
                                      setStudentDropdownOpen(false);
                                    } catch (e) {
                                      console.error(e);
                                      setForm({ ...form, regd_no: s.regd_no, student_name: s.full_name || '', room_no: '' });
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Room No</label>
                    <input
                      type="text"
                      value={form.room_no || ''}
                      onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </>
              ) : (
                <>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Month Year</label>
                      <input type="text" value={form.month_year || ''} readOnly className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Room No</label>
                      <input type="text" value={form.room_no || ''} readOnly className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-600" />
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                {['staying_days', 'mess_amount', 'old_due', 'fine'].map((k) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{k.replace(/_/g, ' ')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form[k] || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = { ...form, [k]: val };
                        if (['mess_amount', 'old_due', 'fine'].includes(k)) {
                          const total = (parseFloat(updated.mess_amount || 0)) +
                            (parseFloat(updated.old_due || 0)) +
                            (parseFloat(updated.fine || 0));
                          updated.total_amount = total;
                        }
                        setForm(updated);
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.total_amount || 0}
                  readOnly
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
                <select
                  value={form.status || 'unpaid'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={form.remarks || ''}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
                  rows="2"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
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
