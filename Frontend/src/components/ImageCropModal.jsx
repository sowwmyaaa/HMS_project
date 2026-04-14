import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { XMarkIcon } from '@heroicons/react/24/outline';

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc, pixelCrop, outputSize = 400) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');
  const { width: cw, height: ch } = pixelCrop;
  canvas.width = outputSize;
  canvas.height = Math.round(outputSize * (ch / cw));
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas empty'));
        else resolve(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}

export default function ImageCropModal({ imageSrc, aspect = 3 / 4, title = 'Crop image', onCancel, onComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, 480);
      const reader = new FileReader();
      reader.onloadend = () => onComplete(reader.result);
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-600">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button type="button" onClick={onCancel} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="relative h-72 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-600">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleApply}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Processing…' : 'Apply crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
