import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import {
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function StudentDoctor() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [today, setToday] = useState(null);
  const [visits, setVisits] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const f = async () => {
      setLoading(true);
      try {
        const [s, t, v] = await Promise.all([
          api.get('/doctor/schedule'),
          api.get('/doctor/today'),
          api.get(`/doctor/visits/${user.regd_no}`, { params: { page, limit } })
        ]);
        setSchedule(s.data);
        setToday(t.data);
        setVisits(v.data?.data ?? []);
        setTotal(v.data.total);
        setTotalPages(v.data.totalPages);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    f();
  }, [user.regd_no, page]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Today's Status</p>
              <p className={`text-lg font-bold ${today?.available ? 'text-green-600' : 'text-red-600'}`}>
                {today?.available ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Time Slot</p>
              <p className="text-lg font-bold text-slate-800">{today?.time_slot || '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Visits</p>
              <p className="text-lg font-bold text-slate-800">{total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            Your Visit History
          </h2>
          <p className="text-sm text-slate-600 mt-1">View your complete doctor visit records</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4" />
                        Date & Time
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Prescription
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {v.visit_date} {v.visit_time}
                      </td>
                      <td className="px-6 py-4 text-slate-900">{v.reason || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{v.prescription || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visits.length && (
                <div className="text-center py-12 text-slate-500">No visit history</div>
              )}
              {visits.length > 0 && (
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
