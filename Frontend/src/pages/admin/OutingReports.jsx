import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { CalendarDaysIcon, ArrowTrendingUpIcon, PrinterIcon, ArrowDownTrayIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const DATE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'particular', label: 'Particular date' },
  { value: 'custom', label: 'Custom date' },
];

const LOCAL_COLOR = '#14b8a6';
const HOME_COLOR = '#a855f7';

function toDateOnly(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function daysBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b - a) / 864e5));
}

export default function AdminOutingReports() {
  const [outings, setOutings] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [particularDate, setParticularDate] = useState(toDateOnly(new Date()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentRegd, setSelectedStudentRegd] = useState('');
  const [studentOutings, setStudentOutings] = useState([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef(null);
  const reportRef = useRef(null);
  const particularStudentRef = useRef(null);

  const getReportParams = () => {
    const today = toDateOnly(new Date());
    const yesterday = toDateOnly(new Date(Date.now() - 864e5));
    if (dateFilter === 'all') return {};
    if (dateFilter === 'today') return { date: today };
    if (dateFilter === 'yesterday') return { date: yesterday };
    if (dateFilter === 'particular' && particularDate) return { date: particularDate };
    if (dateFilter === 'custom' && customFrom && customTo) return { date_from: customFrom, date_to: customTo };
    return {};
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = getReportParams();
      const { data } = await api.get('/outings/report', { params });
      setOutings(data?.data ?? []);
    } catch (e) {
      console.error(e);
      setOutings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFilter, particularDate, customFrom, customTo]);

  useEffect(() => {
    const f = async () => {
      try {
        const { data } = await api.get('/students', { params: { limit: 500 } });
        setStudents(data?.data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    f();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target)) setStudentDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedStudentRegd) {
      setStudentOutings([]);
      return;
    }
    setLoadingStudent(true);
    api
      .get(`/outings/report/student/${encodeURIComponent(selectedStudentRegd)}`)
      .then(({ data }) => setStudentOutings(data?.data ?? []))
      .catch((e) => {
        console.error(e);
        setStudentOutings([]);
      })
      .finally(() => setLoadingStudent(false));
  }, [selectedStudentRegd]);

  const totalLocal = outings.filter((o) => (o.outing_type || '').toLowerCase() === 'local').length;
  const totalHome = outings.filter((o) => (o.outing_type || '').toLowerCase() === 'home').length;
  const todayStr = toDateOnly(new Date());
  const currentlyOutRegds = new Set(
    outings
      .filter(
        (o) =>
          o.status === 'approved' &&
          o.from_date &&
          o.to_date &&
          toDateOnly(o.from_date) <= todayStr &&
          toDateOnly(o.to_date) >= todayStr
      )
      .map((o) => o.regd_no)
  );
  const studentsCurrentlyOut = currentlyOutRegds.size;

  // Monthly trend: group by month (from_date), local vs home count
  const monthMap = {};
  outings.forEach((o) => {
    const d = new Date(o.from_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    if (!monthMap[key]) monthMap[key] = { month: label, local: 0, home: 0 };
    const type = (o.outing_type || '').toLowerCase();
    if (type === 'local') monthMap[key].local += 1;
    else if (type === 'home') monthMap[key].home += 1;
  });
  const monthlyData = Object.keys(monthMap)
    .sort()
    .map((k) => monthMap[k]);

  const pieData = [
    { name: 'Local Outings', value: totalLocal, color: LOCAL_COLOR },
    { name: 'Home Outings', value: totalHome, color: HOME_COLOR },
  ].filter((d) => d.value > 0);
  const pieTotal = totalLocal + totalHome;
  const pieDataWithPct = pieData.map((d) => ({
    ...d,
    pct: pieTotal ? Math.round((d.value / pieTotal) * 100) : 0,
  }));

  const tableRows = outings.map((o) => ({
    ...o,
    days: daysBetween(o.from_date, o.to_date),
  }));

  const particularStudentRows = studentOutings.map((o) => ({
    ...o,
    days: daysBetween(o.from_date, o.to_date),
  }));
  const selectedStudentName = students.find((s) => s.regd_no === selectedStudentRegd)?.full_name || studentOutings[0]?.student_name || selectedStudentRegd;
  const filteredStudentsForDropdown = students.filter(
    (s) =>
      !studentSearch ||
      (s.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.regd_no || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>Outing Report</title>
      <style>body{font-family:sans-serif;padding:16px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;}</style>
      </head><body>
      <h1>Outing Report</h1>
      <p>Filter: ${dateFilter === 'all' ? 'All' : dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : dateFilter === 'particular' ? particularDate : `${customFrom} to ${customTo}`}</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table>
      <thead><tr><th>Reg. No</th><th>Student Name</th><th>Year/Branch</th><th>Phone</th><th>Type</th><th>Purpose</th><th>From Date</th><th>To Date</th><th>Days</th></tr></thead>
      <tbody>
      ${tableRows.map((r) => `<tr><td>${r.regd_no}</td><td>${r.student_name || ''}</td><td>${r.year || '-'}/${r.branch || '-'}</td><td>${r.phone || '-'}</td><td>${r.outing_type}</td><td>${(r.purpose || '').replace(/</g, '&lt;')}</td><td>${formatDisplayDate(r.from_date)}</td><td>${formatDisplayDate(r.to_date)}</td><td>${r.days}</td></tr>`).join('')}
      </tbody></table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const handleCSV = () => {
    const headers = ['Reg. No', 'Student Name', 'Year', 'Branch', 'Phone', 'Type', 'Purpose', 'From Date', 'To Date', 'Days'];
    const rows = tableRows.map((r) => [
      r.regd_no,
      `"${(r.student_name || '').replace(/"/g, '""')}"`,
      r.year ?? '',
      r.branch ?? '',
      r.phone ?? '',
      r.outing_type,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      formatDisplayDate(r.from_date),
      formatDisplayDate(r.to_date),
      r.days,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `outing-report-${toDateOnly(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrintParticular = () => {
    if (!particularStudentRows.length) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>Outing Report - ${selectedStudentName}</title>
      <style>body{font-family:sans-serif;padding:16px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;}</style>
      </head><body>
      <h1>Particular Student - Complete Outing Details</h1>
      <p><strong>Student:</strong> ${selectedStudentName} (${selectedStudentRegd})</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table>
      <thead><tr><th>Reg. No</th><th>Student Name</th><th>Year/Branch</th><th>Phone</th><th>Type</th><th>Purpose</th><th>From Date</th><th>To Date</th><th>Days</th><th>Room</th><th>Status</th></tr></thead>
      <tbody>
      ${particularStudentRows.map((r) => `<tr><td>${r.regd_no}</td><td>${r.student_name || ''}</td><td>${r.year || '-'}/${r.branch || '-'}</td><td>${r.phone || '-'}</td><td>${r.outing_type}</td><td>${(r.purpose || '').replace(/</g, '&lt;')}</td><td>${formatDisplayDate(r.from_date)}</td><td>${formatDisplayDate(r.to_date)}</td><td>${r.days}</td><td>${r.room_no || '-'}</td><td>${r.status}</td></tr>`).join('')}
      </tbody></table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const handleCSVParticular = () => {
    if (!particularStudentRows.length) return;
    const headers = ['Reg. No', 'Student Name', 'Year', 'Branch', 'Phone', 'Type', 'Purpose', 'From Date', 'To Date', 'Days', 'Room', 'Status'];
    const rows = particularStudentRows.map((r) => [
      r.regd_no,
      `"${(r.student_name || '').replace(/"/g, '""')}"`,
      r.year ?? '',
      r.branch ?? '',
      r.phone ?? '',
      r.outing_type,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      formatDisplayDate(r.from_date),
      formatDisplayDate(r.to_date),
      r.days,
      r.room_no || '',
      r.status,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `outing-details-${selectedStudentRegd}-${toDateOnly(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-end gap-4">
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
                  dateFilter === f.value ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                <label className="text-sm text-slate-600">From date</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-sm text-slate-600">To date</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={fetchReport}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600"
              >
                Apply Filter
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)' }}>
                  <ArrowTrendingUpIcon className="w-6 h-6" style={{ color: LOCAL_COLOR }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalLocal}</p>
                  <p className="text-sm text-slate-500">Total Local Outings</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}>
                  <ArrowTrendingUpIcon className="w-6 h-6" style={{ color: HOME_COLOR }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalHome}</p>
                  <p className="text-sm text-slate-500">Total Home Outings</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{studentsCurrentlyOut}</p>
                  <p className="text-sm text-slate-500">Students Currently Out</p>
                </div>
              </div>
            </div>

            
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" ref={particularStudentRef}>
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Particular Student - Complete Outing Details</h3>
          <p className="text-sm text-slate-500 mb-3">Select a student to view their full outing history (all statuses).</p>
          <div ref={studentDropdownRef} className="relative max-w-md">
            <div className="relative">
              <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={selectedStudentRegd ? `${selectedStudentName} (${selectedStudentRegd})` : studentSearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    setSelectedStudentRegd('');
                    setStudentSearch('');
                  } else {
                    setStudentSearch(selectedStudentRegd ? '' : e.target.value);
                    if (selectedStudentRegd) setSelectedStudentRegd('');
                  }
                  setStudentDropdownOpen(true);
                }}
                onFocus={() => setStudentDropdownOpen(true)}
                placeholder="Search by name or registration number..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              {selectedStudentRegd && (
                <button
                  type="button"
                  onClick={() => { setSelectedStudentRegd(''); setStudentSearch(''); setStudentDropdownOpen(true); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
            {studentDropdownOpen && (
              <ul className="absolute z-10 w-full mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                {filteredStudentsForDropdown.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">No students found</li>
                ) : (
                  filteredStudentsForDropdown.map((s) => (
                    <li key={s.regd_no}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentRegd(s.regd_no);
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
          </div>
        </div>
        {selectedStudentRegd && (
          <>
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                Showing all outings for <strong>{selectedStudentName}</strong> ({selectedStudentRegd})
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCSVParticular}
                  disabled={!particularStudentRows.length}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={handlePrintParticular}
                  disabled={!particularStudentRows.length}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print Report
                </button>
              </div>
            </div>
            {loadingStudent ? (
              <div className="p-8 text-center text-slate-500">Loading outing details...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Reg. No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Student Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Year/Branch</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Purpose</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">From Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">To Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Days</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Room</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {particularStudentRows.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800">{o.regd_no}</td>
                        <td className="px-4 py-3 text-slate-800">{o.student_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{o.year ?? '-'}/{o.branch ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{o.phone || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (o.outing_type || '').toLowerCase() === 'home' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {(o.outing_type || '').charAt(0).toUpperCase() + (o.outing_type || '').slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={o.purpose}>{o.purpose || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDisplayDate(o.from_date)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDisplayDate(o.to_date)}</td>
                        <td className="px-4 py-3 text-slate-700">{o.days}</td>
                        <td className="px-4 py-3 text-slate-700">{o.room_no || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              o.status === 'approved' ? 'bg-green-100 text-green-800' : o.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {particularStudentRows.length === 0 && (
                  <p className="p-6 text-center text-slate-500">No outing records for this student.</p>
                )}
              </div>
            )}
          </>
        )}
        {!selectedStudentRegd && (
          <p className="p-6 text-center text-slate-500">Select a student above to view their complete outing details.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" ref={reportRef}>
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Detailed Student Report</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600"
            >
              <PrinterIcon className="w-5 h-5" />
              Print Report
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Reg. No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Year/Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Purpose</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">From Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">To Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Days</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{o.regd_no}</td>
                    <td className="px-4 py-3 text-slate-800">{o.student_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{o.year ?? '-'}/{o.branch ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{o.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (o.outing_type || '').toLowerCase() === 'home'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {(o.outing_type || '').charAt(0).toUpperCase() + (o.outing_type || '').slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={o.purpose}>{o.purpose || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDisplayDate(o.from_date)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDisplayDate(o.to_date)}</td>
                    <td className="px-4 py-3 text-slate-700">{o.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tableRows.length === 0 && (
              <p className="p-6 text-center text-slate-500">No outings for the selected filter.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
