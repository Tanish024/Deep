import { useDropzone } from "react-dropzone";
import { UploadCloud, X, FileVideo } from "lucide-react";

const ACCEPTED_TYPES = {
  "video/mp4": [".mp4"],
  "video/x-msvideo": [".avi"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
};
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export default function Uploader({ file, onFileSelect, onClear, isAnalyzing }) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept: ACCEPTED_TYPES,
      maxSize: MAX_SIZE,
      multiple: false,
      disabled: isAnalyzing,
      onDrop: (accepted) => {
        if (accepted.length > 0) onFileSelect(accepted[0]);
      },
    });

  const rejectionMessage = fileRejections.length > 0
    ? fileRejections[0].errors[0].code === "file-too-large"
      ? "File too large — maximum size is 100MB"
      : "Wrong file type — use MP4, AVI, MOV or WEBM"
    : null;

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer
          ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}
          ${isDragActive
            ? "border-blue-500 bg-blue-50"
            : file
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
          }`}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileVideo className="h-12 w-12 text-green-600" />
            <p className="text-lg font-semibold text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500">{fileSizeMB} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud className="h-14 w-14 text-gray-400" />
            <p className="text-lg font-medium text-gray-600">
              {isDragActive
                ? "Drop your video here..."
                : "Drag & drop a video, or click to browse"}
            </p>
            <p className="text-sm text-gray-400">
              MP4, AVI, MOV, WEBM — max 100MB
            </p>
          </div>
        )}
      </div>

      {file && !isAnalyzing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors mx-auto"
        >
          <X className="h-4 w-4" /> Remove file
        </button>
      )}

      {rejectionMessage && (
        <p className="mt-3 text-center text-sm font-medium text-red-600">
          {rejectionMessage}
        </p>
      )}
    </div>
  );
}
