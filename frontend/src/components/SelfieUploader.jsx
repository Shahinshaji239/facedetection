import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

const SelfieUploader = ({ onUpload, isLoading, uploadError }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const onGalleryClick = () => {
    galleryInputRef.current.click();
  };

  const onCameraClick = () => {
    cameraInputRef.current.click();
  };

  const submitSelfie = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="uploader-card glass-panel mb-4 text-center">
      <h4 className="fw-semibold mb-2 text-dark">Find Your Photos</h4>
      <p className="text-muted mb-4 small">
        Upload a quick selfie, and our AI will fetch all the photos you appear in.
      </p>

      {!preview ? (
        <div
          className={`upload-dropzone ${dragActive ? 'upload-dropzone-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={galleryInputRef}
            type="file"
            className="d-none"
            accept="image/jpeg, image/png, image/jpg"
            onChange={handleChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            className="d-none"
            accept="image/jpeg, image/png, image/jpg"
            capture="user"
            onChange={handleChange}
          />
          <UploadCloud size={56} className={`mb-3 ${dragActive ? 'text-primary' : 'text-secondary'}`} />
          <h5 className="fw-medium mb-3">Drag and drop your selfie</h5>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-outline-primary btn-sm rounded-pill px-4" onClick={onCameraClick}>
              Take a Selfie
            </button>
            <button className="btn btn-outline-secondary btn-sm rounded-pill px-4" onClick={onGalleryClick}>
              Browse Gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column align-items-center uploader-preview-block">
          <div className="position-relative mb-3 d-inline-block uploader-preview-wrap">
            <img
              src={preview}
              alt="Selfie preview"
              className="rounded-circle object-fit-cover shadow uploader-preview"
            />
            <button
              className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 shadow uploader-remove-btn"
              onClick={() => { setFile(null); setPreview(null); }}
              disabled={isLoading}
            >
              ✕
            </button>
          </div>

          {uploadError && (
            <div className="alert alert-danger d-flex align-items-center mb-3 w-100 py-2 small" role="alert">
              <AlertCircle size={16} className="me-2" />
              <div>{uploadError}</div>
            </div>
          )}

          <button
            onClick={submitSelfie}
            disabled={isLoading || !file}
            className="btn btn-gradient d-flex align-items-center fw-medium rounded-pill px-5 py-2 mt-2"
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Searching for matches...
              </>
            ) : (
              <>
                <CheckCircle size={18} className="me-2" />
                Find My Photos
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SelfieUploader;
