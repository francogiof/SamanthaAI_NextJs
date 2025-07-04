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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [parsedProfile, setParsedProfile] = useState<any>(initialProfile || null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCvFile(file);
    setError(null);
    setExtractedText(null);
    setParsedProfile(null);
    if (file) {
      setParsing(true);
      setPreviewUrl(URL.createObjectURL(file));
      // Upload to /api/parse-cv and get extracted text
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
          setExtractedText(data.extractedText || null);
        } else if (res.ok && data.extractedText) {
          setParsedProfile(null);
          setExtractedText(data.extractedText);
          setError('Could not parse profile. Please enter details manually.');
        } else {
          setParsedProfile(null);
          setExtractedText(null);
          setError(data.error || 'Failed to extract text from PDF.');
        }
      } catch (err) {
        setParsedProfile(null);
        setExtractedText(null);
        setError('Server error. Please try again.');
      }
      setParsing(false);
    } else {
      setPreviewUrl(null);
    }
  }

  function handleNext() {
    if (cvFile && parsedProfile) {
      onConfirm(cvFile, parsedProfile);
    }
  }

  async function handleSaveProfile() {
    if (!parsedProfile) return;
    setSaveStatus('Saving...');
    // Ensure user_id and candidate_id are set
    const profileToSave = {
      ...parsedProfile,
      user_id: userId,
      candidate_id: userId,
    };
    try {
      const res = await fetch('/api/candidate/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile: profileToSave }),
      });
      if (res.ok) {
        setSaveStatus('Profile saved!');
      } else {
        setSaveStatus('Failed to save profile.');
      }
    } catch (err) {
      setSaveStatus('Server error.');
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
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(parsedProfile, null, 2)}</pre>
        </div>
      )}
      {extractedText && !parsing && (
        <div className="bg-muted/30 rounded p-3 mt-4">
          <div className="font-semibold mb-1">Extracted CV Text</div>
          <textarea
            className="w-full h-40 p-2 border rounded bg-background text-foreground text-xs font-mono"
            value={extractedText}
            readOnly
            style={{ resize: 'vertical' }}
          />
        </div>
      )}
      <div className="flex gap-2 self-end">
        <button
          className="bg-green-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
          disabled={!parsedProfile || parsing}
          onClick={handleSaveProfile}
        >
          Save Profile
        </button>
        <button
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
          disabled={!cvFile || parsing}
          onClick={handleNext}
        >
          Next Stage
        </button>
      </div>
      {saveStatus && <div className="text-xs text-muted-foreground self-end">{saveStatus}</div>}
    </div>
  );
}
