import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export default function StudentOutingReports() {
  const { user } = useAuth();
  const [outings, setOutings] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const f = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/outings/student/${user.regd_no}`, { params: { page, limit } });
        setOutings(data?.data ?? []);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    f();
  }, [user.regd_no, page]);

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-4 h-4" />
          Approved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="w-4 h-4" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <ClockIcon className="w-4 h-4" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            Outing Reports
          </h2>
          <p className="text-sm text-slate-600 mt-1">View your complete outing history</p>
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
                        <MapPinIcon className="w-4 h-4" />
                        Type
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4" />
                        From
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4" />
                        To
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {outings.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {o.outing_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{o.purpose || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(o.from_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(o.to_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(o.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!outings.length && (
                <div className="text-center py-12 text-slate-500">No outing history</div>
              )}
              {outings.length > 0 && (
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
