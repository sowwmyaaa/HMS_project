import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { compressImageToBase64 } from '../../utils/imageCompress';
import { ArrowUpTrayIcon, MagnifyingGlassIcon, EyeIcon, EyeSlashIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'DS', 'EIE', 'CB', 'MECH', 'CIVIL'];
const YEARS = [1, 2, 3, 4];

export default function AdminApplicationDetails() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [form, setForm] = useState({});
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const photoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const fetchStudents = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/students', { params: { search: search || undefined, page: p, limit } });
      setStudents(data?.data ?? []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchStudents(page); }, [search, page]);

  const handleEdit = async (s) => {
    setModal('edit');
    try {
      const { data } = await api.get(`/students/${s.regd_no}`);
      setForm({ ...data, password: '' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to load student details');
      setForm({ ...s, password: '' });
    }
  };

  const handleDelete = async (regd_no) => {
    if (!confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/${regd_no}`);
      toast.success('Student deleted successfully');
      fetchStudents(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  const handleView = async (s) => {
    try {
      const { data } = await api.get(`/students/${s.regd_no}`);
      setViewStudent(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load student details');
    }
  };

  const handleFileToBase64 = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const base64 = await compressImageToBase64(file);
      setForm((f) => ({ ...f, [field]: base64 }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to process image. Use a smaller image.');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { password, ...rest } = form;
      await api.put(`/students/${form.regd_no}`, { ...rest, password: password || undefined });
      toast.success('Student updated successfully');
      setModal(null);
      fetchStudents(page);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Registration Number or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Link
              to="/admin/registration"
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium shadow hover:from-blue-700 hover:to-cyan-600 transition"
            >
              Register New Student
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Photo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Full Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Reg. Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Year & Branch</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Father Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mother Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(students ?? []).map((s) => (
                    <tr key={s.regd_no} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 overflow-hidden" title="No photo">
                          {s.photo_base64 ? (
                            <img src={s.photo_base64} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 opacity-70" aria-hidden />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">{s.full_name}</td>
                      <td className="px-4 py-3 text-slate-700">{s.regd_no}</td>
                      <td className="px-4 py-3 text-slate-700">{s.year} - {s.branch}</td>
                      <td className="px-4 py-3 text-slate-700">{s.father_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{s.mother_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{s.student_phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {s.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(s)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg" title="View"><EyeIcon className="w-5 h-5" /></button>
                          <button onClick={() => handleEdit(s)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg" title="Edit"><PencilIcon className="w-5 h-5" /></button>
                          <button onClick={() => handleDelete(s.regd_no)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </div>

      {modal === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Edit Student</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Student Photo</p>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileToBase64(e, 'photo_base64')} />
                    <div onClick={() => photoInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100">
                      {form.photo_base64 ? <img src={form.photo_base64} alt="Preview" className="h-28 w-full object-cover rounded" /> : <><ArrowUpTrayIcon className="w-10 h-10 text-slate-400 mb-2" /><span className="text-sm text-slate-500">Upload Photo</span></>}
                    </div>
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="mt-2 w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium rounded-lg shadow">Choose Photo</button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Digital Signature</p>
                    <input ref={signatureInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileToBase64(e, 'student_signature_base64')} />
                    <div onClick={() => signatureInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 min-h-[100px]">
                      {form.student_signature_base64 ? <img src={form.student_signature_base64} alt="Signature" className="max-h-16 w-full object-contain" /> : <><ArrowUpTrayIcon className="w-8 h-8 text-slate-400 mb-1" /><span className="text-sm text-slate-500">Upload Signature</span></>}
                    </div>
                    <button type="button" onClick={() => signatureInputRef.current?.click()} className="mt-2 w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium rounded-lg shadow">Choose Signature</button>
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Password (leave blank to keep current)</label><div className="relative"><input type={showPasswordEdit ? 'text' : 'password'} value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={() => setShowPasswordEdit(!showPasswordEdit)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700">{showPasswordEdit ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Father's Name *</label><input required value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Father's Phone *</label><input required value={form.father_phone} onChange={(e) => setForm({ ...form, father_phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Mother's Name *</label><input required value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Mother's Phone</label><input value={form.mother_phone} onChange={(e) => setForm({ ...form, mother_phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Student Phone *</label><input required value={form.student_phone} onChange={(e) => setForm({ ...form, student_phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Branch *</label><select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"><option value="">Select Branch</option>{BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Year *</label><select value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"><option value="">Select Year</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label><select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"><option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Aadhaar No. *</label><input required value={form.aadhaar_no} onChange={(e) => setForm({ ...form, aadhaar_no: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">DOB *</label><input type="date" required value={form.dob?.slice?.(0, 10) || form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Religion</label><input value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Caste</label><input value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1"> RoomRent Payment Status</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="payment" value="PAID" checked={form.payment_status === 'PAID'} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} className="text-blue-600" /><span className="text-slate-700">Paid</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="payment" value="UNPAID" checked={form.payment_status === 'UNPAID'} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} className="text-blue-600" /><span className="text-slate-700">Unpaid</span></label>
                    </div>
                  </div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address *</label><textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg shadow">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewStudent(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">Student Details</h3>
              <button type="button" onClick={() => setViewStudent(null)} className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">&times;</button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex justify-center">
                {viewStudent.photo_base64 ? (
                  <img src={viewStudent.photo_base64} alt="Student" className="h-36 w-36 object-cover border-2 border-slate-200 rounded-xl shadow" />
                ) : (
                  <div className="h-36 w-36 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center text-slate-400" title="No photo on file">
                    <UserIcon className="w-16 h-16 opacity-60" aria-hidden />
                    <span className="text-xs mt-2 px-2 text-center">No photo</span>
                  </div>
                )}
              </div>
              <div><span className="text-slate-500 text-sm block">Regd No</span><p className="font-medium text-slate-800">{viewStudent.regd_no}</p></div>
              <div><span className="text-slate-500 text-sm block">Full Name</span><p className="font-medium text-slate-800">{viewStudent.full_name}</p></div>
              <div><span className="text-slate-500 text-sm block">Father Name</span><p className="text-slate-700">{viewStudent.father_name}</p></div>
              <div><span className="text-slate-500 text-sm block">Father Phone No.</span><p className="text-slate-700">{viewStudent.father_phone || '-'}</p></div>
              <div><span className="text-slate-500 text-sm block">Mother Name</span><p className="text-slate-700">{viewStudent.mother_name}</p></div>
              <div><span className="text-slate-500 text-sm block">Mother Phone No.</span><p className="text-slate-700">{viewStudent.mother_phone || '-'}</p></div>
              <div><span className="text-slate-500 text-sm block">Student Phone No.</span><p className="text-slate-700">{viewStudent.student_phone}</p></div>
              <div><span className="text-slate-500 text-sm block">Branch / Year</span><p className="text-slate-700">{viewStudent.branch} / {viewStudent.year}</p></div>
              <div><span className="text-slate-500 text-sm block">Blood Group</span><p className="text-slate-700">{viewStudent.blood_group}</p></div>
              <div><span className="text-slate-500 text-sm block">Caste</span><p className="text-slate-700">{viewStudent.caste || '-'}</p></div>
              <div><span className="text-slate-500 text-sm block">DOB</span><p className="text-slate-700">{viewStudent.dob ? String(viewStudent.dob).slice(0, 10) : '-'}</p></div>
              <div><span className="text-slate-500 text-sm block">Aadhaar No.</span><p className="text-slate-700">{viewStudent.aadhaar_no || '-'}</p></div>
              <div><span className="text-slate-500 text-sm block">RoomRent Payment Status</span><p><span className={viewStudent.payment_status === 'PAID' ? 'text-green-600 font-medium' : 'text-amber-600'}>{viewStudent.payment_status}</span></p></div>
              <div className="sm:col-span-2"><span className="text-slate-500 text-sm block">Address</span><p className="text-slate-700">{viewStudent.address}</p></div>
              {viewStudent.student_signature_base64 && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 text-sm block mb-1">Signature</span>
                  <img src={viewStudent.student_signature_base64} alt="Signature" className="h-16 w-40 object-contain border rounded-lg bg-slate-50 p-2" />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button type="button" onClick={() => setViewStudent(null)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Close</button>
              <button type="button" onClick={() => { setViewStudent(null); handleEdit(viewStudent); }} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg shadow">Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
