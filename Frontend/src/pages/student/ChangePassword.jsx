import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

export default function StudentChangePassword() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDone(false);

    if (form.new_password !== form.confirm_password) {
      toast.error('New password and confirm password do not match');
      setLoading(false);
      return;
    }

    if (form.new_password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await api.put('/students/me/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setDone(true);
      toast.success('Password changed successfully');
      setForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LockClosedIcon className="w-6 h-6 text-blue-600" />
            Change Password
          </h2>
          <p className="text-sm text-slate-600 mt-1">Update your account password for better security</p>
        </div>

        <div className="p-6">
          {done && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <KeyIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 font-medium">Password Changed Successfully</p>
                <p className="text-sm text-green-600">Your password has been updated successfully.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LockClosedIcon className="w-4 h-4" />
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={form.current_password}
                  onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <KeyIcon className="w-4 h-4" />
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter your new password (min. 6 characters)"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LockClosedIcon className="w-4 h-4" />
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {form.new_password && form.confirm_password && form.new_password !== form.confirm_password && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || (form.new_password && form.confirm_password && form.new_password !== form.confirm_password)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="w-5 h-5" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Security Tips:</strong>
            </p>
            <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
              <li>Use a strong password with a mix of letters, numbers, and special characters</li>
              <li>Don't share your password with anyone</li>
              <li>Change your password regularly for better security</li>
              <li>Never use personal information like your name or registration number as your password</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
