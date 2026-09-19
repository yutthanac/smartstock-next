'use client';

import React from 'react';
import {
  Eye,
  Camera,
  RefreshCw,
  RotateCw,
  Upload,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface ReceiptImageViewerProps {
  currentImage: string;
  currentImageIndex: number;
  totalImagesCount: number;
  images: string[];
  rotation: number;
  isScanning: boolean;
  scanProgress: number;
  scanStage: string;
  isDragging: boolean;
  verifiedImagesSet: Set<number>;
  onFileInputClick: () => void;
  onRescan: () => void;
  onRotate: () => void;
  onSelectImageIndex: (idx: number) => void;
  onAddNewImage: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export const ReceiptImageViewer: React.FC<ReceiptImageViewerProps> = ({
  currentImage,
  currentImageIndex,
  totalImagesCount,
  images,
  rotation,
  isScanning,
  scanProgress,
  scanStage,
  isDragging,
  verifiedImagesSet,
  onFileInputClick,
  onRescan,
  onRotate,
  onSelectImageIndex,
  onAddNewImage,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  return (
    <div className="lg:col-span-5 bg-stone-950 p-4 flex flex-col justify-between overflow-y-auto border-b lg:border-b-0 lg:border-r border-stone-800 relative select-none">
      {/* Image Header Controls */}
      <div className="flex items-center justify-between text-stone-300 pb-2 mb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-stone-200 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-stone-400" />
            ใบเสร็จที่ {currentImageIndex + 1} / {totalImagesCount}
          </span>
          {verifiedImagesSet.has(currentImageIndex) ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-semibold">
              ตรวจแล้ว
            </span>
          ) : isScanning ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-semibold flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              กำลังตรวจสอบ {scanProgress}%
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700 text-[10px] font-semibold">
              รอการตรวจสอบ
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onFileInputClick}
            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="เปลี่ยนรูปภาพหรือถ่ายใหม่"
          >
            <Camera className="w-3.5 h-3.5 text-stone-400" />
            <span>เปลี่ยน</span>
          </button>
          <button
            type="button"
            onClick={onRescan}
            disabled={isScanning}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            title="สแกนซ้ำ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-stone-100' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onRotate}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            title="หมุนภาพ 90 องศา"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Display */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/50 relative min-h-[260px] p-2 transition-all ${
          isDragging ? 'ring-2 ring-stone-400 bg-stone-900' : ''
        }`}
      >
        {currentImage ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentImage}
              alt={`Receipt ${currentImageIndex + 1}`}
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-h-[420px] w-auto max-w-full object-contain rounded transition-transform duration-200 shadow-md"
            />

            {/* Scanning banner with real-time percentage progress */}
            {isScanning && (
              <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 z-10 animate-fade-in">
                <div className="relative mb-3 flex items-center justify-center">
                  <RefreshCw className="w-9 h-9 animate-spin text-stone-300" />
                  <span className="absolute font-mono font-bold text-[10px] text-white tabular-nums">
                    {scanProgress}%
                  </span>
                </div>

                <div className="font-semibold text-sm text-stone-100 flex items-center gap-1.5">
                  <span>กำลังตรวจสอบใบเสร็จ...</span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    {scanProgress}%
                  </span>
                </div>

                <div className="w-56 h-2 bg-stone-800 rounded-full overflow-hidden my-2.5 border border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-stone-400 via-amber-300 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                <div className="text-xs text-stone-400 text-center max-w-xs transition-all">
                  {scanStage}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  (ใบที่ {currentImageIndex + 1} จาก {totalImagesCount} ใบ)
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-stone-500 p-6 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto opacity-40 text-stone-400" />
            <p className="text-xs">ยังไม่มีภาพถ่ายใบเสร็จในลิสต์นี้</p>
            <button
              type="button"
              onClick={onAddNewImage}
              className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> อัปโหลดรูปใบเสร็จ
            </button>
          </div>
        )}
      </div>

      {/* Multiple Images Selector & Stepper */}
      {images.length > 1 && (
        <div className="pt-3 space-y-2 border-t border-stone-800 mt-3">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>เลือกใบเสร็จที่ต้องการตรวจ:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentImageIndex === 0}
                onClick={() => onSelectImageIndex(currentImageIndex - 1)}
                className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 cursor-pointer text-stone-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-stone-300 text-[11px] px-1">
                {currentImageIndex + 1}/{images.length}
              </span>
              <button
                type="button"
                disabled={currentImageIndex === images.length - 1}
                onClick={() => onSelectImageIndex(currentImageIndex + 1)}
                className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 cursor-pointer text-stone-200"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => onSelectImageIndex(idx)}
                className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                  currentImageIndex === idx
                    ? 'border-stone-300 ring-2 ring-stone-500/50'
                    : 'border-stone-700 hover:border-stone-500 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
                {verifiedImagesSet.has(idx) && (
                  <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] shadow-sm">
                    ✓
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-stone-900/80 text-white text-[9px] text-center font-mono">
                  #{idx + 1}
                </span>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddNewImage}
              className="w-14 h-14 rounded-lg border-2 border-dashed border-stone-700 hover:border-stone-400 bg-stone-900/60 flex flex-col items-center justify-center shrink-0 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              title="เพิ่มรูปภาพใบเสร็จอีกใบ"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[9px]">เพิ่ม</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
