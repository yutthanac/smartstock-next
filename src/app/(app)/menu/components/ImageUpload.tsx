import React from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  image: string;
  onChange: (imageVal: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ image, onChange }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800; // Resize to max 800px width/height for optimal storage and quality
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
            onChange(compressedBase64);
          }
        };
        if (typeof event.target?.result === 'string') {
          img.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="sm:col-span-2">
      <label className="font-semibold text-slate-700 block mb-1">รูปภาพเมนูอาหาร</label>

      {/* Image Preview & Upload Container */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {/* Preview Box */}
        <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden shrink-0 group">
          {image ? (
            <>
              <img
                src={image}
                alt="Menu Preview"
                className="w-full h-full object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-1 right-1 p-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                title="ลบรูปภาพ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="text-center p-2 text-slate-400">
              <ImageIcon className="w-6 h-6 mx-auto opacity-50 mb-1" />
              <span className="text-[10px]">ไม่มีรูปภาพ</span>
            </div>
          )}
        </div>

        {/* Upload button & URL Input */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-4 py-2 bg-white hover:bg-[#4fb0a5]/10 border border-slate-200 hover:border-[#4fb0a5] rounded-xl text-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-2xs">
              <Upload className="w-4 h-4 text-[#4fb0a5]" />
              <span>เลือกไฟล์รูปจากเครื่อง...</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400">JPG, PNG, WEBP (สูงสุด 5MB)</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="หรือวาง URL รูปภาพที่นี่..."
              value={image}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4fb0a5]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
