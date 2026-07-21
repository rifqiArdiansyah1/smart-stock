'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  productId: string;
  currentImageUrl?: string | null;
  onUploadComplete: (publicUrl: string, key: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export default function ImageUpload({
  productId,
  currentImageUrl,
  onUploadComplete,
  onRemove,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setErrorMsg(null);

    // Validasi tipe
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Format tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.');
      return;
    }

    // Validasi ukuran
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`Ukuran file maksimal ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Preview lokal
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploadState('uploading');
    setProgress(0);

    try {
      // Step 1: Minta pre-signed URL dari server
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, mimeType: file.type, fileSize: file.size }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error || 'Gagal mendapatkan pre-signed URL');
      }

      const { uploadUrl, publicUrl, key } = await presignRes.json();

      // Step 2: Upload langsung ke R2 menggunakan XMLHttpRequest untuk tracking progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload gagal: HTTP ${xhr.status}`));
        });

        xhr.addEventListener('error', () => reject(new Error('Koneksi terputus saat upload')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setUploadState('success');
      setProgress(100);
      onUploadComplete(publicUrl, key);
    } catch (err: any) {
      setUploadState('error');
      setErrorMsg(err.message || 'Upload gagal');
      setPreview(currentImageUrl || null);
    }
  }, [productId, currentImageUrl, onUploadComplete]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input agar file yang sama bisa diupload ulang
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleRemove = async () => {
    if (!preview || !onRemove) return;
    setPreview(null);
    setUploadState('idle');
    setProgress(0);
    onRemove();
  };

  const isUploading = uploadState === 'uploading';
  const showDropzone = !preview || uploadState === 'error';

  return (
    <div className="flex flex-col gap-3">
      {/* Image Preview */}
      {preview && uploadState !== 'error' && (
        <div className="relative w-full aspect-square max-w-[200px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
          <img
            src={preview}
            alt="Foto produk"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                title="Ganti foto"
              >
                ✏️ Ganti
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors text-sm font-medium"
                  title="Hapus foto"
                >
                  🗑️
                </button>
              )}
            </div>
          )}

          {/* Progress Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white text-sm font-bold">{progress}%</span>
            </div>
          )}

          {/* Success Badge */}
          {uploadState === 'success' && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              ✓ Tersimpan
            </div>
          )}
        </div>
      )}

      {/* Dropzone */}
      {showDropzone && !disabled && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center
            transition-all duration-200 select-none
            ${isDragging
              ? 'border-primary-500 bg-primary-50 scale-[1.02]'
              : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/50'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <div className="text-3xl mb-2">📸</div>
          <p className="text-sm font-semibold text-slate-700">
            {isDragging ? 'Lepaskan untuk upload' : 'Klik atau seret foto ke sini'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            JPG, PNG, WebP, AVIF — Maks. {MAX_SIZE_MB}MB
          </p>

          {isUploading && (
            <div className="mt-3">
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Mengupload... {progress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
