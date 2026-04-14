import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import {
  CalendarDaysIcon,
  ClockIcon,
  PhoneIcon,
  DocumentTextIcon,
  HomeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export default function StudentOutingRequest() {
  const [form, setForm] = useState({ outing_type: 'home', purpose: '', from_date: '', from_time: '08:00', to_date: '', to_time: '18:00', phone: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDone(false);
    try {
      const from_date = `${form.from_date}T${form.from_time}:00`;
      const to_date = `${form.to_date}T${form.to_time}:00`;
      await api.post('/outings', { ...form, from_date, to_date });
      setDone(true);
      toast.success('Outing request submitted. Pending approval.');
      setForm({ outing_type: 'home', purpose: '', from_date: '', from_time: '08:00', to_date: '', to_time: '18:00', phone: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            Outing Request
          </h2>
          <p className="text-sm text-slate-600 mt-1">Submit a request for hostel outing permission</p>
        </div>

        <div className="p-6">
          {done && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 font-medium">Request Submitted Successfully</p>
                <p className="text-sm text-green-600">Your outing request is pending approval.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <HomeIcon className="w-4 h-4" />
                Outing Type *
              </label>
              <select
                value={form.outing_type}
                onChange={(e) => setForm({ ...form, outing_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="home">Home</option>
                <option value="local">Local</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                Purpose *
              </label>
              <input
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g. Family visit, Medical appointment"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4" />
                  From Date *
                </label>
                <input
                  type="date"
                  value={form.from_date}
                  onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  From Time
                </label>
                <input
                  type="time"
                  value={form.from_time}
                  onChange={(e) => setForm({ ...form, from_time: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4" />
                  To Date *
                </label>
                <input
                  type="date"
                  value={form.to_date}
                  onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  To Time
                </label>
                <input
                  type="time"
                  value={form.to_time}
                  onChange={(e) => setForm({ ...form, to_time: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <PhoneIcon className="w-4 h-4" />
                Contact Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your contact number"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CalendarDaysIcon className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
