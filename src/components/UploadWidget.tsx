"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  X,
  FileImage,
  ArrowRightLeft,
  AlertCircle,
  History,
} from "lucide-react";

interface UploadWidgetProps {
  isCompareMode: boolean;
  setIsCompareMode: (val: boolean) => void;
  beforeFile: File | null;
  setBeforeFile: (f: File | null) => void;
  afterFile: File | null;
  setAfterFile: (f: File | null) => void;
  earlierImagePaths: string[];
  onSelectEarlierAsBefore?: (path: string) => void;
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function UploadWidget({
  isCompareMode,
  setIsCompareMode,
  beforeFile,
  setBeforeFile,
  afterFile,
  setAfterFile,
  earlierImagePaths,
  onSelectEarlierAsBefore,
}: UploadWidgetProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const beforePreviewUrl = React.useMemo(
    () => (beforeFile ? URL.createObjectURL(beforeFile) : null),
    [beforeFile]
  );
  const afterPreviewUrl = React.useMemo(
    () => (afterFile ? URL.createObjectURL(afterFile) : null),
    [afterFile]
  );

  React.useEffect(() => {
    return () => {
      if (beforePreviewUrl) URL.revokeObjectURL(beforePreviewUrl);
      if (afterPreviewUrl) URL.revokeObjectURL(afterPreviewUrl);
    };
  }, [beforePreviewUrl, afterPreviewUrl]);

  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setErrorMsg(null);
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg("Invalid file type. Allowed: JPG, PNG, WEBP.");
        return resolve(false);
      }
      if (file.size > MAX_SIZE_BYTES) {
        setErrorMsg("File exceeds 20MB maximum limit.");
        return resolve(false);
      }

      // Check dimensions (>= 256px)
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width < 256 || img.height < 256) {
          setErrorMsg(
            `Image resolution too low (${img.width}x${img.height}). Minimum 256x256 required.`
          );
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setErrorMsg("Failed to read image dimensions.");
        resolve(false);
      };
      img.src = objectUrl;
    });
  };

  const handleFileDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    slot: "before" | "after"
  ) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const valid = await validateFile(file);
      if (valid) {
        if (slot === "before") setBeforeFile(file);
        else setAfterFile(file);
      }
    }
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: "before" | "after"
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const valid = await validateFile(file);
      if (valid) {
        if (slot === "before") setBeforeFile(file);
        else setAfterFile(file);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsCompareMode(false);
              setBeforeFile(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              !isCompareMode
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Single Query (1 Image)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCompareMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCompareMode
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Temporal Comparison (Before &amp; After)</span>
          </button>
        </div>

        {isCompareMode && earlierImagePaths.length > 0 && onSelectEarlierAsBefore && (
          <button
            type="button"
            onClick={() => onSelectEarlierAsBefore(earlierImagePaths[0])}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            title="Load your earliest uploaded image into Before slot"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Use Earlier Image as Before</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Slots grid */}
      <div className={`grid gap-3 ${isCompareMode ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {/* BEFORE SLOT (only in compare mode) */}
        {isCompareMode && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleFileDrop(e, "before")}
            onClick={() => beforeInputRef.current?.click()}
            className={`relative rounded-xl border border-dashed transition-all p-3 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] ${
              beforeFile
                ? "border-emerald-500/40 bg-neutral-900/90"
                : "border-neutral-700 bg-neutral-900/40 hover:border-neutral-500"
            }`}
          >
            <input
              ref={beforeInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleInputChange(e, "before")}
            />

            {beforeFile ? (
              <div className="w-full flex items-center gap-3">
                <img
                  src={beforePreviewUrl || ""} loading="lazy" decoding="async"
                  alt="Before Preview"
                  className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                />
                <div className="flex-1 text-left min-w-0">
                  <div className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 mb-1">
                    BEFORE (T1)
                  </div>
                  <p className="text-xs font-medium text-neutral-200 truncate">
                    {beforeFile.name}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {(beforeFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBeforeFile(null);
                  }}
                  className="p-1 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-neutral-400 mb-1.5" />
                <div className="text-xs font-semibold text-neutral-300">
                  Slot 1: Before Image (Baseline)
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Click or drag satellite capture (T1)
                </p>
              </>
            )}
          </div>
        )}

        {/* AFTER / PRIMARY OBSERVATION SLOT */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleFileDrop(e, "after")}
          onClick={() => afterInputRef.current?.click()}
          className={`relative rounded-xl border border-dashed transition-all p-3 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] ${
            afterFile
              ? "border-emerald-500/40 bg-neutral-900/90"
              : "border-neutral-700 bg-neutral-900/40 hover:border-neutral-500"
          }`}
        >
          <input
            ref={afterInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => handleInputChange(e, "after")}
          />

          {afterFile ? (
            <div className="w-full flex items-center gap-3">
              <img
                src={afterPreviewUrl || ""} loading="lazy" decoding="async"
                alt="After Preview"
                className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
              />
              <div className="flex-1 text-left min-w-0">
                <div className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 mb-1">
                  {isCompareMode ? "AFTER (T2) - TARGET" : "QUERY IMAGE"}
                </div>
                <p className="text-xs font-medium text-neutral-200 truncate">
                  {afterFile.name}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {(afterFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAfterFile(null);
                }}
                className="p-1 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 text-emerald-400 mb-1.5" />
              <div className="text-xs font-semibold text-neutral-200">
                {isCompareMode
                  ? "Slot 2: After Image (Target for AI Marks)"
                  : "Upload Satellite Image for Query"}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                PNG, JPG, WEBP &bull; Max 20MB &bull; Min 256px
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
