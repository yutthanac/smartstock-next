import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  image: string;
  onChange: (imageVal: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ image, onChange, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="mb-1">
        <label className="font-semibold text-stone-700 block text-xs">รูปภาพประกอบ</label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {image ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full flex-1 min-h-[72px] rounded-xl border transition-all p-2 flex items-center gap-2.5 ${
            isDragging
              ? 'border-stone-800 bg-stone-100 ring-2 ring-stone-800/20'
              : 'border-stone-200 bg-stone-50'
          }`}
        >
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-200 shrink-0 border border-stone-200 relative group">
            <img
              src={image}
              alt="Menu Preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-700 truncate mb-1">
              {image.startsWith('data:') ? 'รูปภาพที่เลือก' : image}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3 text-stone-600" />
                <span>เปลี่ยน</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>ลบ</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex-1 min-h-[72px] py-3 px-3 rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-center text-center select-none ${
            isDragging
              ? 'border-stone-800 bg-stone-100 text-stone-900'
              : 'border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-500'
          }`}
        >
          <p className="text-xs font-medium">
            คลิกหรือลากไฟล์ภาพมาวางที่นี่ <span className="opacity-75 text-xs text-stone-400 sm:block">(ไม่เกิน 5MB/ไฟล์)</span>
          </p>
        </div>
      )}
    </div>
  );
};

