import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  LightBulbIcon,
  TableCellsIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  BoltIcon,
  Square3Stack3DIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const FACILITY_CONFIG = [
  { key: 'beds', label: 'Beds', icon: HomeIcon },
  { key: 'cots', label: 'Cots', icon: Squares2X2Icon },
  { key: 'fans', label: 'Fans', icon: BoltIcon },
  { key: 'tube_lights', label: 'Tube Lights', icon: LightBulbIcon },
  { key: 'chairs', label: 'Study Table', icon: TableCellsIcon },
  { key: 'dustbin', label: 'Dustbin', icon: TrashIcon },
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

const FLOOR_OPTIONS = [
  { value: 'all', label: 'All Floors' },
  { value: 'Ground Floor', label: 'Ground Floor' },
  { value: 'First Floor', label: 'First Floor' },
  { value: 'Second Floor', label: 'Second Floor' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Available', label: 'Available' },
  { value: 'Nearly Full', label: 'Nearly Full' },
  { value: 'Full', label: 'Full' },
];

export default function AdminRoomDetails() {
  const [rooms, setRooms] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [searchRoom, setSearchRoom] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        api.get('/rooms', { params: { search: searchApplied || undefined, limit: 500 } }),
        api.get('/room-allotments', { params: { limit: 500 } }),
      ]);
      setRooms(rRes.data?.data ?? []);
      setAllotments(aRes.data?.data ?? []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [searchApplied]);

  const occupancyByRoom = allotments.reduce((acc, a) => {
    acc[a.room_number] = (acc[a.room_number] || 0) + 1;
    return acc;
  }, {});

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => (occupancyByRoom[r.room_number] || 0) >= (r.max_sharing || 4)).length;
  let availableBeds = 0;
  rooms.forEach((r) => {
    const occ = occupancyByRoom[r.room_number] || 0;
    availableBeds += Math.max(0, (r.max_sharing || 4) - occ);
  });
  const totalStudents = allotments.length;

  const getRoomStatus = (room) => {
    const occ = occupancyByRoom[room.room_number] || 0;
    const max = room.max_sharing || 4;
    if (occ >= max) return { label: 'Full', className: 'bg-red-100 text-red-800' };
    if (occ === 0) return { label: 'Available', className: 'bg-green-100 text-green-800' };
    return { label: 'Nearly Full', className: 'bg-amber-100 text-amber-800' };
  };

  const filteredRooms = rooms.filter((room) => {
    const floor = getFloor(room.room_number);
    const status = getRoomStatus(room).label;
    if (filterFloor !== 'all' && floor !== filterFloor) return false;
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    return true;
  });

  const handleAdd = () => {
    setModal('add');
    setForm({ room_number: '', beds: 4, cots: 2, fans: 2, tube_lights: 2, chairs: 2, dustbin: 1, washrooms: 'ATTACHED', foot_stand: 1, mirrors: 1, shelf: 4, max_sharing: 4, bed_lights: 2 });
  };

  const handleEdit = (r) => {
    setModal('edit');
    setForm({ ...r });
  };

  const handleDelete = async (room_number) => {
    if (!confirm('Delete this room?')) return;
    try {
      await api.delete(`/rooms/${room_number}`);
      toast.success('Room deleted successfully');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/rooms', form);
        toast.success('Room added successfully');
      } else {
        await api.put(`/rooms/${form.room_number}`, form);
        toast.success('Room updated successfully');
      }
      setModal(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800">Room Details</h2>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Room Management</h3>
            <p className="text-sm text-slate-500 mt-0.5">Manage hostel rooms and allocations.</p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Add New Room
          </button>
        </div>

        <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by room number..."
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setSearchApplied(searchRoom.trim()))}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={() => setSearchApplied(searchRoom.trim())}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            Search
          </button>
          {searchApplied && (
            <button
              type="button"
              onClick={() => { setSearchRoom(''); setSearchApplied(''); }}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
          <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-4">
            <FunnelIcon className="w-5 h-5 text-slate-500" />
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              {FLOOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <BuildingOffice2Icon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalRooms}</p>
              <p className="text-sm text-slate-500">Total Rooms</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{occupiedRooms}</p>
              <p className="text-sm text-slate-500">Occupied Rooms</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{availableBeds}</p>
              <p className="text-sm text-slate-500">Available Beds</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
              <p className="text-sm text-slate-500">Total Students</p>
            </div>
          </div>
        </div>

        {(searchApplied || filterFloor !== 'all' || filterStatus !== 'all') && (
          <div className="px-6 pb-2 text-sm text-slate-500">
            Showing {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
            {rooms.length !== filteredRooms.length && ` of ${rooms.length}`}
          </div>
        )}
        <div className="p-6 pt-0 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const occ = occupancyByRoom[room.room_number] || 0;
            const max = room.max_sharing || 4;
            const pct = max ? Math.min(100, (occ / max) * 100) : 0;
            const status = getRoomStatus(room);
            const isFull = occ >= max;
            const isAvailable = occ === 0;
            const barColor = isFull ? 'bg-red-500' : isAvailable ? 'bg-green-500' : 'bg-amber-500';
            return (
              <div key={room.room_number} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-slate-800">Room {room.room_number}</h4>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{getFloor(room.room_number)}</p>
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Occupancy</span>
                    <span>{occ}/{max}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                  {FACILITY_CONFIG.map(({ key, label, icon: Icon }) => (
                    <span key={key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span>{label}: {room[key] ?? '-'}</span>
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                    <BuildingOffice2Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>Washroom: {room.washrooms ?? '-'}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(room)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg" title="Edit"><PencilIcon className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(room.room_number)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{modal === 'add' ? 'Add Room' : 'Edit Room'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room Number *</label>
                <input required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" disabled={modal === 'edit'} />
              </div>
              {['beds', 'cots', 'fans', 'tube_lights', 'chairs', 'dustbin', 'foot_stand', 'mirrors', 'shelf', 'max_sharing', 'bed_lights'].map((k) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{k.replace(/_/g, ' ')}</label>
                  <input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Washrooms</label>
                <select value={form.washrooms} onChange={(e) => setForm({ ...form, washrooms: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  <option value="ATTACHED">ATTACHED</option>
                  <option value="COMMON">COMMON</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
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
