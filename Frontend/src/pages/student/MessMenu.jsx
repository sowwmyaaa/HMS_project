import { useState, useEffect } from 'react';
import api from '../../api';
import {
  CalendarDaysIcon,
  SunIcon,
  MoonIcon,
  CakeIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function StudentMessMenu() {
  const [menu, setMenu] = useState([]);
  const [today, setToday] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const f = async () => {
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
    f();
  }, []);

  const current = selectedDay ? menu.find((m) => m.day_name === selectedDay) : today;
  const isToday = current?.day_name === today?.day_name;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            Mess Menu
          </h2>
          <p className="text-sm text-slate-600 mt-1">View daily mess menu for all days</p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Select day to view menu:</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                    selectedDay === d
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : current ? (
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                  {current.day_name} Menu
                </h3>
                {isToday && (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Today
                  </span>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <SunIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800">Breakfast</h4>
                  </div>
                  <p className="text-slate-700 ml-13">{current.breakfast || '-'}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <FireIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800">Lunch</h4>
                  </div>
                  <p className="text-slate-700 ml-13">{current.lunch || '-'}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <CakeIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800">Snacks</h4>
                  </div>
                  <p className="text-slate-700 ml-13">{current.snacks || '-'}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MoonIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800">Dinner</h4>
                  </div>
                  <p className="text-slate-700 ml-13">{current.dinner || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No menu available for selected day</div>
          )}
        </div>
      </div>
    </div>
  );
}
