import { useRef, useState } from "react";

export interface CVUploadProps {
  onConfirm: (cvFile: File | null, parsedProfile: any) => void;
  initialProfile?: any;
  userId: number;
}

export default function CVUpload({ onConfirm, initialProfile, userId }: CVUploadProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [parsedProfile, setParsedProfile] = useState<any>(initialProfile || null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCvFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setParsedProfile(null);
    setExtractedText(null);
    setError(null);
    setParsed(false);
    setParseStatus(null);
  }

  async function handleParseCV() {
    if (!cvFile) return;
    setParsing(true);
    setParseStatus(null);
    setError(null);
    // Upload to /api/parse-cv and get extracted text
    const formData = new FormData();
    formData.append('file', cvFile);
    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setParsedProfile(data.profile);
        setExtractedText(data.extractedText || null);
        setParsed(true);
        setParseStatus('CV parsed successfully!');
      } else if (res.ok && data.extractedText) {
        setParsedProfile(null);
        setExtractedText(data.extractedText);
        setParsed(true);
        setParseStatus('Could not parse profile. Please enter details manually.');
      } else {
        setParsedProfile(null);
        setExtractedText(null);
        setParsed(false);
        setParseStatus(null);
        setError(data.error || 'Failed to extract text from PDF.');
      }
    } catch (err) {
      setParsedProfile(null);
      setExtractedText(null);
      setParsed(false);
      setParseStatus(null);
      setError('Server error. Please try again.');
    }
    setParsing(false);
  }

  function handleNext() {
    if (cvFile && parsedProfile) {
      onConfirm(cvFile, parsedProfile);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="font-semibold">Upload your CV (PDF or DOCX):</label>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="block border rounded p-2"
        onChange={handleFileChange}
        disabled={parsing}
      />
      {previewUrl && (
        <div
          className="mt-2 flex justify-center items-center overflow-auto bg-white border border-gray-200 rounded"
          style={{ width: 210, height: 297, maxWidth: 210, maxHeight: 297 }}
        >
          <span className="sr-only">Preview:</span>
          <iframe
            src={previewUrl}
            title="CV Preview"
            style={{
              width: 420, // double the container width
              height: 594, // double the container height
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              border: 'none',
              background: '#fff',
            }}
          />
        </div>
      )}
      {cvFile && !parsed && !parsing && (
        <button
          className="bg-green-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60 w-fit"
          onClick={handleParseCV}
        >
          Parse CV
        </button>
      )}
      {parsing && (
        <div className="w-full flex items-center justify-center my-4">
          <div className="w-1/2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '80%' }} />
          </div>
          <span className="ml-3 text-blue-600 font-medium">Parsing CV...</span>
        </div>
      )}
      {parseStatus && (
        <div className="w-full flex items-center justify-center my-2">
          <div className="w-1/2 h-2 bg-green-400 rounded-full" />
          <span className="ml-3 text-green-700 font-medium">{parseStatus}</span>
        </div>
      )}
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2 self-end">
        <button
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
          disabled={!cvFile || !parsedProfile || parsing}
          onClick={handleNext}
        >
          Next Stage
        </button>
      </div>
    </div>
  );
}
