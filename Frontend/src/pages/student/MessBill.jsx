import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import {
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function StudentMessBill() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [currentBill, setCurrentBill] = useState(null);
  const [pendingBills, setPendingBills] = useState([]);
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]}-${now.getFullYear()}`;
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = -6; i <= 12; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const year = date.getFullYear();
      const month = months[date.getMonth()];
      options.push(`${month}-${year}`);
    }
    return options;
  };

  const monthYearOptions = generateMonthYearOptions();

  useEffect(() => {
    const f = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/mess-bills/student/${user.regd_no}`, { params: { page, limit } });
        setBills(data?.data ?? []);
        setTotal(data.total);
        setTotalPages(data.totalPages);

        // Find current month bill
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthYear = `${months[now.getMonth()]}-${now.getFullYear()}`;
        const current = data?.data?.find((b) => b.month_year === currentMonthYear);
        setCurrentBill(current || null);

        // Find pending bills (unpaid)
        const pending = data?.data?.filter((b) => (b.payment_status || b.status || 'unpaid') === 'unpaid');
        setPendingBills(pending || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    f();
  }, [user.regd_no, page]);

  const formatMonthYear = (my) => {
    if (!my) return '';
    const [month, year] = my.split('-');
    const monthNames = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };
    return `${monthNames[month] || month} ${year}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
            Mess Bill
          </h2>
          <p className="text-sm text-slate-600 mt-1">Your monthly mess charges</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : (
            <>
              {currentBill && (
                <div className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Mess Bill Details</h3>
                      <p className="text-2xl font-bold mb-1">{formatMonthYear(currentBill.month_year)}</p>
                      <div className="flex items-center gap-6 mt-4">
                        <div>
                          <p className="text-sm opacity-90">Total Bill Amount</p>
                          <p className="text-3xl font-bold">₹{parseFloat(currentBill.total_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-90">Days Present</p>
                          <p className="text-xl font-semibold">{currentBill.staying_days || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {(currentBill.payment_status || currentBill.status || 'unpaid') === 'paid' ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <CheckCircleIcon className="w-6 h-6" />
                          <span className="font-semibold">Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <XCircleIcon className="w-6 h-6" />
                          <span className="font-semibold">Unpaid</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pendingBills.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClockIcon className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">Pending Bills</h3>
                  </div>
                  <div className="space-y-2">
                    {pendingBills.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-slate-800">{formatMonthYear(b.month_year)}</p>
                          <p className="text-sm text-slate-600">Days: {b.staying_days || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">₹{parseFloat(b.total_amount || 0).toFixed(2)}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="w-3 h-3" />
                            Unpaid
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <CalendarDaysIcon className="w-5 h-5 text-slate-500" />
                  <label className="text-sm font-medium text-slate-700">Filter by Month:</label>
                  <select
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    {monthYearOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            Month
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Days Present
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Mess Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Fine
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <div className="flex items-center justify-end gap-2">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            Total Amount
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {bills
                        .filter((b) => !monthYear || b.month_year === monthYear)
                        .map((b) => {
                          const paymentStatus = b.payment_status || b.status || 'unpaid';
                          return (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                                {formatMonthYear(b.month_year)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                                {b.staying_days || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                                ₹{parseFloat(b.mess_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                                ₹{parseFloat(b.fine || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="font-semibold text-slate-900">
                                  ₹{parseFloat(b.total_amount || 0).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {paymentStatus === 'paid' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Paid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <XCircleIcon className="w-4 h-4" />
                                    Unpaid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {bills.filter((b) => !monthYear || b.month_year === monthYear).length === 0 && (
                    <div className="text-center py-12 text-slate-500">No payment history found</div>
                  )}
                  {bills.length > 0 && (
                    <div className="mt-4">
                      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
