import { useState, useEffect } from 'react';
import api from '../../api';
import Pagination from '../../components/Pagination';
import {
  BuildingOffice2Icon,
  HomeIcon,
  LightBulbIcon,
  TableCellsIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  BoltIcon,
  Square3Stack3DIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const FACILITY_CONFIG = [
  { key: 'beds', label: 'Beds', icon: HomeIcon },
  { key: 'cots', label: 'Cots', icon: Squares2X2Icon },
  { key: 'fans', label: 'Fans', icon: BoltIcon },
  { key: 'tube_lights', label: 'Tube Lights', icon: LightBulbIcon },
  { key: 'chairs', label: 'Study Table', icon: TableCellsIcon },
  { key: 'dustbin', label: 'Dustbin', icon: ArchiveBoxIcon },
  { key: 'foot_stand', label: 'Foot Stand', icon: Square3Stack3DIcon },
  { key: 'mirrors', label: 'Mirrors', icon: DocumentDuplicateIcon },
  { key: 'shelf', label: 'Shelf', icon: ArchiveBoxIcon },
  { key: 'max_sharing', label: 'Max Sharing', icon: UserGroupIcon },
  { key: 'bed_lights', label: 'Bed Lights', icon: LightBulbIcon },
];

function getFloor(roomNumber) {
  const n = parseInt(String(roomNumber).replace(/\D/g, ''), 10) || 0;
  if (n < 200) return 'Ground Floor';
  if (n < 300) return 'First Floor';
  if (n < 400) return 'Second Floor';
  return 'Floor';
}

export default function StudentRoomDetails() {
  const [rooms, setRooms] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const f = async () => {
      setLoading(true);
      try {
        const [rRes, aRes] = await Promise.all([
          api.get('/rooms', { params: { search: search || undefined, page, limit } }),
          api.get('/room-allotments', { params: { limit: 500 } })
        ]);
        setRooms(rRes.data?.data ?? []);
        setTotal(rRes.data.total);
        setTotalPages(rRes.data.totalPages);
        setAllotments(aRes.data?.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    f();
  }, [search, page]);

  const occupancyByRoom = allotments.reduce((acc, a) => {
    acc[a.room_number] = (acc[a.room_number] || 0) + 1;
    return acc;
  }, {});

  const getRoomStatus = (room) => {
    const occ = occupancyByRoom[room.room_number] || 0;
    const max = room.max_sharing || 4;
    if (occ >= max) return { label: 'Full', className: 'bg-red-100 text-red-800' };
    if (occ === 0) return { label: 'Available', className: 'bg-green-100 text-green-800' };
    return { label: 'Nearly Full', className: 'bg-amber-100 text-amber-800' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
            Room Details
          </h2>
          <p className="text-sm text-slate-600 mt-1">Browse available rooms and their facilities</p>
        </div>

        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by room number..."
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
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No rooms found</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const occ = occupancyByRoom[room.room_number] || 0;
                const max = room.max_sharing || 4;
                const pct = max ? Math.min(100, (occ / max) * 100) : 0;
                const status = getRoomStatus(room);
                const isFull = occ >= max;
                const isAvailable = occ === 0;
                const barColor = isFull ? 'bg-red-500' : isAvailable ? 'bg-green-500' : 'bg-amber-500';
                return (
                  <div key={room.room_number} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-lg text-slate-800">Room {room.room_number}</h4>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{getFloor(room.room_number)}</p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span className="flex items-center gap-1.5">
                          <UserGroupIcon className="w-4 h-4" />
                          Occupancy
                        </span>
                        <span className="font-medium">{occ}/{max}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {FACILITY_CONFIG.map(({ key, label, icon: Icon }) => (
                        <span key={key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs">
                          <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span>{label}: {room[key] ?? '-'}</span>
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs">
                        <BuildingOffice2Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>Washroom: {room.washrooms ?? '-'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && rooms.length > 0 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
