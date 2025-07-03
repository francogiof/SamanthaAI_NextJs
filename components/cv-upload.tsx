import React, { useRef, useState } from "react";

export interface CVUploadProps {
  onConfirm: (cvFile: File | null, parsedProfile: any) => void;
  initialProfile?: any;
}

export default function CVUpload({ onConfirm, initialProfile }: CVUploadProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<any>(initialProfile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCvFile(file);
    setParsedProfile(null);
    if (file) {
      setParsing(true);
      setPreviewUrl(URL.createObjectURL(file));
      // Simulate parsing delay
      setTimeout(() => {
        // Simulate parsed profile (fallback to manual entry if not PDF)
        setParsedProfile({
          name: "John Doe",
          email: "john.doe@email.com",
          experience: "3 years at Acme Corp",
          education: "BSc Computer Science",
        });
        setParsing(false);
      }, 1200);
    } else {
      setPreviewUrl(null);
    }
  }

  function handleConfirm() {
    onConfirm(cvFile, parsedProfile);
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
      />
      {previewUrl && (
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <iframe
            src={previewUrl}
            title="CV Preview"
            className="w-full h-40 border rounded mt-1"
          />
        </div>
      )}
      {parsing && <div className="text-blue-500">Parsing CV...</div>}
      {parsedProfile && !parsing && (
        <div className="bg-muted/40 rounded p-3 mt-2">
          <div className="font-semibold mb-1">Parsed Profile Preview</div>
          <div><b>Name:</b> {parsedProfile.name}</div>
          <div><b>Email:</b> {parsedProfile.email}</div>
          <div><b>Experience:</b> {parsedProfile.experience}</div>
          <div><b>Education:</b> {parsedProfile.education}</div>
        </div>
      )}
      <button
        className="mt-2 bg-primary text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
        disabled={!cvFile || parsing}
        onClick={handleConfirm}
      >
        Confirm & Continue
      </button>
    </div>
  );
}
