import { useState, useEffect } from 'react';
import api from '../../api';
import Pagination from '../../components/Pagination';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export default function StudentRoomAllotment() {
  const [allotments, setAllotments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([
        api.get('/room-allotments', { params: { search: search || undefined, page: p, limit } }),
        api.get('/rooms', { params: { limit: 500 } })
      ]);
      setAllotments(a.data?.data ?? []);
      setTotal(a.data.total);
      setTotalPages(a.data.totalPages);
      setRooms(r.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetch(page); }, [search, page]);

  const getVacancy = (room_number) => {
    const room = rooms.find((r) => r.room_number === room_number);
    const count = allotments.filter((a) => a.room_number === room_number).length;
    return room ? `${count}/${room.max_sharing}` : '-';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
            Room Allotment
          </h2>
          <p className="text-sm text-slate-600 mt-1">View room allocations and occupancy</p>
        </div>

        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by room number or student name..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
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
                        <BuildingOffice2Icon className="w-4 h-4" />
                        Room No
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Registration No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4" />
                        Name
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="w-4 h-4" />
                        Year/Branch
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Vacancy
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {allotments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-900">{a.room_number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{a.regd_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">{a.student_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{a.year}/{a.branch}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getVacancy(a.room_number)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!allotments.length && (
                <div className="text-center py-12 text-slate-500">No allotments found</div>
              )}
              {allotments.length > 0 && (
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
