import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  UserCircleIcon,
  IdentificationIcon,
  PhoneIcon,
  HomeIcon,
  CalendarDaysIcon,
  HeartIcon,
  AcademicCapIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PhotoIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

const HOSTEL_RULES = [
  'Students must maintain discipline and follow hostel timings.',
  'No unauthorized persons are allowed in the hostel premises.',
  'Students must inform warden before going on outing.',
  'Proper dress code must be followed within hostel.',
  'Damage to hostel property will be charged from the student.',
  'Mobile phones to be used responsibly.',
  'Food from outside is not allowed in rooms.',
  'Students must keep their rooms clean and tidy.',
];

export default function StudentApplication() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const f = async () => {
      try {
        const { data } = await api.get('/students/me');
        setStudent(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    f();
  }, [user.regd_no]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center text-slate-600">
        Application not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-4">
            {student.photo_base64 ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={student.photo_base64} alt="Student" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center border-4 border-white shadow-lg">
                <UserCircleIcon className="w-12 h-12 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{student.full_name}</h2>
              <p className="text-slate-600 mt-0.5">{student.regd_no}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                  <AcademicCapIcon className="w-4 h-4" />
                  {student.year} / {student.branch}
                </span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${student.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {student.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            Application Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <IdentificationIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Registration Number</p>
                  <p className="text-base font-semibold text-slate-800 mt-0.5">{student.regd_no}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <UserCircleIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Full Name</p>
                  <p className="text-base font-semibold text-slate-800 mt-0.5">{student.full_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CalendarDaysIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Date of Birth</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.dob ? String(student.dob).slice(0, 10) : '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <HeartIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Blood Group</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.blood_group || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Caste</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.caste || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <IdentificationIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Aadhaar Number</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.aadhaar_no || '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <UserCircleIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Father's Name</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.father_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <UserCircleIcon className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Mother's Name</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.mother_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <PhoneIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Student Phone</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.student_phone || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <PhoneIcon className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Father's Phone</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.father_phone || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <PhoneIcon className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Mother's Phone</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.mother_phone || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <HomeIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Address</p>
                  <p className="text-base font-medium text-slate-800 mt-0.5">{student.address || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {(student.photo_base64 || student.student_signature_base64) && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <PhotoIcon className="w-4 h-4" />
                Documents
              </h4>
              <div className="flex flex-wrap gap-6">
                {student.photo_base64 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Student Photo</p>
                    <img src={student.photo_base64} alt="Student" className="h-32 w-32 object-cover rounded-lg border-2 border-white shadow-sm" />
                  </div>
                )}
                {student.student_signature_base64 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Signature</p>
                    <img src={student.student_signature_base64} alt="Signature" className="h-16 w-40 object-contain border-2 border-white bg-white rounded-lg shadow-sm" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
            Hostel Rules & Guidelines
          </h3>
          <p className="text-sm text-slate-600 mt-1">Please read and follow these rules for a safe and disciplined hostel environment.</p>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {HOSTEL_RULES.map((r, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700 flex-1">{r}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
