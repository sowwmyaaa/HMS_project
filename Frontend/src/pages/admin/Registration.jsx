import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';
import { compressImageToBase64 } from '../../utils/imageCompress';
import ImageCropModal from '../../components/ImageCropModal';
import { ArrowUpTrayIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const BRANCHES = ['CSE','ECE','EEE','IT','AIML','DS','EIE','CB','MECH','CIVIL'];
const YEARS = [1,2,3,4];

const initialForm = {
  regd_no:'',
  full_name:'',
  father_name:'',
  father_phone:'',
  mother_name:'',
  mother_phone:'',
  student_phone:'',
  address:'',
  aadhaar_no:'',
  blood_group:'',
  caste:'',
  religion:'',
  branch:'',
  year:'',
  payment_status:'UNPAID',
  dob:'',
  password:'student123',

  photo_base64:'',
  student_signature_base64:'',

  father_photo_base64:'',
  father_signature_base64:'',

  mother_photo_base64:'',
  mother_signature_base64:''
};

export default function AdminRegistration(){

const navigate = useNavigate();

const [form,setForm] = useState(initialForm);
const [submitting,setSubmitting] = useState(false);
const [showPassword,setShowPassword] = useState(false);
const [cropOpen, setCropOpen] = useState(null);

const photoInputRef = useRef(null);
const signatureInputRef = useRef(null);

const fatherPhotoRef = useRef(null);
const fatherSignatureRef = useRef(null);

const motherPhotoRef = useRef(null);
const motherSignatureRef = useRef(null);


const handleFileToBase64 = async (e,field)=>{

const file = e.target.files?.[0];

if(!file || !file.type.startsWith('image/')) return;

try{

const base64 = await compressImageToBase64(file);

setForm(f=>({...f,[field]:base64}));

}
catch(err){

toast.error('Image too large');

}

e.target.value='';

};

const openCropForField = (file, field, aspect) => {
  const reader = new FileReader();
  reader.onload = () => setCropOpen({ src: reader.result, field, aspect });
  reader.readAsDataURL(file);
};


const handleSubmit = async(e)=>{

e.preventDefault();

setSubmitting(true);

try{

await api.post('/students',form);

toast.success('Student registered successfully');

navigate('/admin/application');

}
catch(err){

toast.error(err.response?.data?.error || 'Registration failed');

}
finally{

setSubmitting(false);

}

};


const UploadBox = ({ title, refInput, field, value, aspect }) => (
  <div>
    <p className="text-sm font-medium text-slate-700 mb-2">{title}</p>

    <input
      ref={refInput}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        if (aspect) openCropForField(file, field, aspect);
        else handleFileToBase64({ target: { files: [file] } }, field);
      }}
    />

    <div className="flex flex-col items-center">

      {/* Passport Frame */}
      <div
        onClick={() => refInput.current?.click()}
        className="w-[100px] h-[130px] border border-slate-300 rounded-md bg-white flex items-center justify-center cursor-pointer overflow-hidden shadow-sm"
      >
        {value ? (
          <img
            src={value}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-slate-400 text-center px-2">
            Passport Size Photo
          </span>
        )}
      </div>

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => refInput.current?.click()}
        className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        {aspect ? 'Upload & crop' : 'Upload Photo'}
      </button>

    </div>
  </div>
);

return(

<div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">

<div className="p-6 border-b border-slate-200">
<h2 className="text-xl font-semibold text-slate-800">Student Registration</h2>
<p className="text-sm text-slate-500 mt-1">Register a new student in the hostel system.</p>
</div>


<form onSubmit={handleSubmit} className="p-6">

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">


{/* LEFT IMAGE PANEL */}

<div className="space-y-6">

<UploadBox
title="Student Photo"
refInput={photoInputRef}
field="photo_base64"
value={form.photo_base64}
aspect={3 / 4}
/>

<UploadBox
title="Student Signature"
refInput={signatureInputRef}
field="student_signature_base64"
value={form.student_signature_base64}
aspect={2.5}
/>

<UploadBox
title="Father Photo"
refInput={fatherPhotoRef}
field="father_photo_base64"
value={form.father_photo_base64}
aspect={3 / 4}
/>

<UploadBox
title="Father Signature"
refInput={fatherSignatureRef}
field="father_signature_base64"
value={form.father_signature_base64}
aspect={2.5}
/>

<UploadBox
title="Mother Photo"
refInput={motherPhotoRef}
field="mother_photo_base64"
value={form.mother_photo_base64}
aspect={3 / 4}
/>

<UploadBox
title="Mother Signature"
refInput={motherSignatureRef}
field="mother_signature_base64"
value={form.mother_signature_base64}
aspect={2.5}
/>

</div>


{/* RIGHT FORM SECTION */}

<div className="md:col-span-2 grid grid-cols-2 gap-4">


<div>
<label className="text-sm font-medium">Registration Number *</label>
<input required
value={form.regd_no}
onChange={(e)=>setForm({...form,regd_no:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Password</label>

<div className="relative">

<input
type={showPassword ? 'text':'password'}
value={form.password}
onChange={(e)=>setForm({...form,password:e.target.value})}
className="w-full border rounded-lg px-3 py-2 pr-10"
/>

<button
type="button"
onClick={()=>setShowPassword(!showPassword)}
className="absolute right-2 top-2"
>

{showPassword ? <EyeSlashIcon className="w-5"/> : <EyeIcon className="w-5"/>}

</button>

</div>

</div>


<div className="col-span-2">
<label className="text-sm font-medium">Full Name *</label>
<input required
value={form.full_name}
onChange={(e)=>setForm({...form,full_name:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Father Name *</label>
<input required
value={form.father_name}
onChange={(e)=>setForm({...form,father_name:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Father Phone *</label>
<input required
value={form.father_phone}
onChange={(e)=>setForm({...form,father_phone:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Mother Name *</label>
<input required
value={form.mother_name}
onChange={(e)=>setForm({...form,mother_name:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Mother Phone</label>
<input
value={form.mother_phone}
onChange={(e)=>setForm({...form,mother_phone:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Student Phone *</label>
<input required
value={form.student_phone}
onChange={(e)=>setForm({...form,student_phone:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Branch *</label>
<select required
value={form.branch}
onChange={(e)=>setForm({...form,branch:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
>
<option value="">Select Branch</option>
{BRANCHES.map(b=><option key={b}>{b}</option>)}
</select>
</div>


<div>
<label className="text-sm font-medium">Year *</label>
<select required
value={form.year}
onChange={(e)=>setForm({...form,year:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
>
<option value="">Select Year</option>
{YEARS.map(y=><option key={y}>{y}</option>)}
</select>
</div>


<div>
<label className="text-sm font-medium">Blood Group</label>
<select
value={form.blood_group}
onChange={(e)=>setForm({...form,blood_group:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
>
<option>Select Blood Group</option>
{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=>(
<option key={g}>{g}</option>
))}
</select>
</div>


<div>
<label className="text-sm font-medium">Aadhaar Number *</label>
<input required
value={form.aadhaar_no}
onChange={(e)=>setForm({...form,aadhaar_no:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Date of Birth *</label>
<input required type="date"
value={form.dob}
onChange={(e)=>setForm({...form,dob:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Religion</label>
<input
value={form.religion}
onChange={(e)=>setForm({...form,religion:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div>
<label className="text-sm font-medium">Caste</label>
<input
value={form.caste}
onChange={(e)=>setForm({...form,caste:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>
</div>


<div className="col-span-2">

<label className="text-sm font-medium">Payment Status</label>

<div className="flex gap-6 mt-1">

<label className="flex items-center gap-2">

<input type="radio"
value="PAID"
checked={form.payment_status==='PAID'}
onChange={(e)=>setForm({...form,payment_status:e.target.value})}
/>

Paid

</label>

<label className="flex items-center gap-2">

<input type="radio"
value="UNPAID"
checked={form.payment_status==='UNPAID'}
onChange={(e)=>setForm({...form,payment_status:e.target.value})}
/>

Unpaid

</label>

</div>

</div>


<div className="col-span-2">

<label className="text-sm font-medium">Address</label>

<textarea rows={3}
value={form.address}
onChange={(e)=>setForm({...form,address:e.target.value})}
className="w-full border rounded-lg px-3 py-2"
/>

</div>


</div>

</div>


<div className="mt-6 flex justify-end gap-3">

<button
type="button"
onClick={()=>navigate('/admin/application')}
className="px-4 py-2 border rounded-lg"
>
Cancel
</button>

<button
type="submit"
disabled={submitting}
className="px-6 py-2 bg-blue-600 text-white rounded-lg"
>
{submitting ? 'Registering...' : 'Register Student'}
</button>

</div>


</form>

{cropOpen && (
  <ImageCropModal
    imageSrc={cropOpen.src}
    aspect={cropOpen.aspect}
    title="Crop & resize"
    onCancel={() => setCropOpen(null)}
    onComplete={(base64) => {
      setForm((f) => ({ ...f, [cropOpen.field]: base64 }));
      setCropOpen(null);
    }}
  />
)}

</div>

);
}