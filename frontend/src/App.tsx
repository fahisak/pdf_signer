import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "./index.css";
import "./react-pdf.css";

// Vite-compatible PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [signedPdf, setSignedPdf] = useState<ArrayBuffer | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [signedFileName, setSignedFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);


const handleUpload = async () => {
  if (!file) return;
  setLoading(true);
  setSignedPdf(null);

  try {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetch("http://localhost:4000/sign", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Server error");

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    setSignedPdf(arrayBuffer);

    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);

    const disposition = response.headers.get("Content-Disposition");
    setSignedFileName(
      disposition?.match(/filename="(.+)"/)?.[1] || `signed-${file.name}`
    );

    // Reset file input after successful upload/sign
    setFile(null);
    // Optional: Reset native input value (for some browsers)
    const inputElement = document.getElementById("fileInput") as HTMLInputElement;
    if (inputElement) inputElement.value = "";

  } catch (err) {
    console.error(err);
    alert("Failed to sign PDF. Check console.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container">
      <h1>PDF Signer</h1>

      {/* Custom File Upload */}
      <div className="file-upload-wrapper">
        <input
          type="file"
          id="fileInput"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="fileInput" className="file-upload-btn">
          {file ? file.name : "Choose PDF"}
        </label>
      </div>

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? "Signing..." : "Upload & Sign"}
      </button>

      {/* PDF Viewer */}
      {signedPdf && (
        <div className="pdf-viewer">
          <div className="file-header">
            <h3>{`Signed File: ${signedFileName}`}</h3>
            
          </div>
          <div className="direction-rtl">
            <a
              className="download-link"
              href={downloadUrl}
              download={signedFileName}
            >
              Download
            </a>
          </div>
          

          <Document
            file={{ data: signedPdf }}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(err) => console.error("PDF load error:", err)}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={`page_${i + 1}`}
                pageNumber={i + 1}
                width={Math.min(window.innerWidth * 0.9, 800)}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            ))}
          </Document>
        </div>
      )}
    </div>
  );
}
