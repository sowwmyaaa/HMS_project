import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export default function AdminMessMenu() {
  const [menu, setMenu] = useState([]);
  const [today, setToday] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([api.get('/mess-menu'), api.get('/mess-menu/today')]);
      setMenu(m.data);
      setToday(t.data);
      if (!selectedDay) setSelectedDay(t.data?.day_name || DAYS[new Date().getDay()] || 'MON');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const current = selectedDay ? menu.find((m) => m.day_name === selectedDay) : today;

  const handleEdit = (m) => {
    setEditForm({ ...m });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/mess-menu/${editForm.day_name}`, editForm);
      setEditForm(null);
      toast.success('Mess menu updated');
      fetch();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <p className="text-sm text-slate-600 mb-2">Select day to view menu:</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button key={d} onClick={() => setSelectedDay(d)} className={`px-4 py-2.5 rounded-lg font-medium ${selectedDay === d ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{d}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : current ? (
        <div className="p-6 max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-slate-800">Today: {current.day_name}</h3>
            <button onClick={() => handleEdit(current)} className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">Edit</button>
          </div>
            <div className="grid gap-4">
              <div><span className="font-medium text-slate-600">Breakfast:</span> {current.breakfast}</div>
              <div><span className="font-medium text-slate-600">Lunch:</span> {current.lunch}</div>
              <div><span className="font-medium text-slate-600">Snacks:</span> {current.snacks}</div>
              <div><span className="font-medium text-slate-600">Dinner:</span> {current.dinner}</div>
            </div>
        </div>
      ) : (
        <div className="p-8 text-slate-500">No menu for selected day</div>
      )}
      {editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit Menu - {editForm.day_name}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              {['breakfast','lunch','snacks','dinner'].map((k) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{k}</label>
                  <input value={editForm[k]} onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditForm(null)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
