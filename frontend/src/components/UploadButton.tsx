import { useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { uploadRecipe } from "../lib/api";
import type { UploadResponse } from "../lib/types";
import { cx } from "./shared";

const maxUploadBytes = 10 * 1024 * 1024;
const acceptedUploadTypes = new Set(["application/pdf", "text/plain"]);

interface UploadButtonProps {
  uploading: boolean;
  onUploadStart: () => void;
  onUploadComplete: (response: UploadResponse) => void;
  onUploadError: (message: string) => void;
}

export function UploadButton({
  uploading,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: UploadButtonProps) {
  const activeUploadRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef(0);

  useEffect(() => {
    return () => {
      activeUploadRef.current?.abort();
    };
  }, []);

  const handleFile = async (file?: File) => {
    if (!file) return;

    const validationError = validateRecipeFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    activeUploadRef.current?.abort();
    const uploadId = uploadIdRef.current + 1;
    uploadIdRef.current = uploadId;
    const controller = new AbortController();
    activeUploadRef.current = controller;

    onUploadStart();

    try {
      const response = await uploadRecipe(file, { signal: controller.signal });
      if (uploadIdRef.current === uploadId) {
        onUploadComplete(response);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (uploadIdRef.current === uploadId) {
        onUploadError(error instanceof Error ? error.message : "The recipe could not be uploaded.");
      }
    } finally {
      if (uploadIdRef.current === uploadId) {
        activeUploadRef.current = null;
      }
    }
  };

  return (
    <label
      className={cx(
        "relative inline-flex min-h-16 w-full min-w-[156px] cursor-pointer items-center justify-center gap-2.5 rounded-[18px] px-5 py-3.5 text-[#fffdf8] shadow-[0_14px_28px_rgba(47,111,88,0.24)] transition-[background,box-shadow,transform] duration-200 active:scale-[0.98] sm:w-auto",
        uploading ? "bg-[#8a6139]" : "bg-[#2f6f58]",
      )}
    >
      <Upload size={28} />
      <span>{uploading ? "Loading" : "Upload"}</span>
      <input
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        type="file"
        accept=".pdf,.txt,text/plain,application/pdf"
        disabled={uploading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function validateRecipeFile(file: File): string | null {
  if (file.size > maxUploadBytes) {
    return "Please upload a recipe smaller than 10 MB.";
  }

  const lowerName = file.name.toLowerCase();
  const hasAcceptedExtension = lowerName.endsWith(".pdf") || lowerName.endsWith(".txt");
  const hasAcceptedType = acceptedUploadTypes.has(file.type);
  const hasGenericType = file.type === "" || file.type === "application/octet-stream";

  if (!hasAcceptedType && !(hasGenericType && hasAcceptedExtension)) {
    return "Please upload a PDF or plain text recipe.";
  }

  return null;
}
