import { useRef, useState } from "react";

export interface CVUploadProps {
  onConfirm: (cvFile: File | null, parsedProfile: any) => void;
  initialProfile?: any;
}

export default function CVUpload({ onConfirm, initialProfile }: CVUploadProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<any>(initialProfile || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCvFile(file);
    setParsedProfile(null);
    setError(null);
    if (file) {
      setParsing(true);
      setPreviewUrl(URL.createObjectURL(file));
      // Upload to /api/parse-cv and get structured profile
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/parse-cv', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.profile) {
          setParsedProfile(data.profile);
        } else {
          setParsedProfile(null);
          setError(data.error || 'Failed to parse CV. Please enter your details manually.');
        }
      } catch (err) {
        setParsedProfile(null);
        setError('Server error. Please try again.');
      }
      setParsing(false);
    } else {
      setPreviewUrl(null);
    }
  }

  function handleNext() {
    if (parsedProfile) {
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
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {parsedProfile && !parsing && (
        <div className="bg-muted/40 rounded p-3 mt-2">
          <div className="font-semibold mb-1">Parsed Profile Preview</div>
          <div><b>Name:</b> {parsedProfile.name}</div>
          {parsedProfile.age && <div><b>Age:</b> {parsedProfile.age}</div>}
          {parsedProfile.linkedin && <div><b>LinkedIn:</b> {parsedProfile.linkedin}</div>}
          {parsedProfile.github && <div><b>GitHub:</b> {parsedProfile.github}</div>}
          {parsedProfile.experience_years && <div><b>Experience Years:</b> {parsedProfile.experience_years}</div>}
          {parsedProfile.education && <div><b>Education:</b> {parsedProfile.education}</div>}
          {parsedProfile.personal_projects && <div><b>Personal Projects:</b> {parsedProfile.personal_projects}</div>}
          {parsedProfile.introduction && <div><b>Introduction:</b> {parsedProfile.introduction}</div>}
          {parsedProfile.cv_experience && (
            <div>
              <b>Experience:</b>
              <ul className="list-disc ml-6">
                {Array.isArray(parsedProfile.cv_experience)
                  ? parsedProfile.cv_experience.map((exp: any, i: number) => (
                      <li key={i}>{typeof exp === 'string' ? exp : JSON.stringify(exp)}</li>
                    ))
                  : <li>{parsedProfile.cv_experience}</li>}
              </ul>
            </div>
          )}
        </div>
      )}
      <button
        className="mt-2 bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60 self-end"
        disabled={!parsedProfile || parsing}
        onClick={handleNext}
      >
        Next Stage
      </button>
    </div>
  );
}
