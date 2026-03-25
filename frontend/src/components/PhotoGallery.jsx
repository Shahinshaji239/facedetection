import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { Download, XSquare } from 'lucide-react';
import api from '../services/api';

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1
};

const PhotoGallery = ({ photos }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No photos found.</p>
      </div>
    );
  }

  const handleDownload = async (e, url) => {
    e.stopPropagation();
    const filename = url.split('/').pop()?.split('?')[0] || `event-photo-${Date.now()}.jpg`;

    try {
      // Fetch the image as a blob through the proxy (handles CORS)
      const proxyUrl = `${api.defaults.baseURL}/proxy-image/?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Proxy download failed, opening in new tab:', err);
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {photos.map((photoUrl, index) => (
          <div key={index} className="gallery-item">
            <img
              src={photoUrl}
              alt={`Match ${index + 1}`}
              className="w-100 h-auto d-block gallery-image"
              onClick={() => setSelectedImage(photoUrl)}
              loading="lazy"
            />
            <div className="gallery-overlay">
              <button
                onClick={(e) => handleDownload(e, photoUrl)}
                className="btn btn-sm btn-light rounded-circle p-2 lh-1"
                aria-label="Download photo"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </Masonry>

      {/* Lightbox for full screen view */}
      {selectedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 z-index-modal d-flex justify-content-center align-items-center"
          style={{ zIndex: 1050, backdropFilter: 'blur(5px)' }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="position-absolute top-0 end-0 m-4 btn btn-link text-white p-0 border-0"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <XSquare size={36} />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Full screen preview" 
            className="img-fluid" 
            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="position-absolute bottom-0 mb-4 text-center w-100">
             <button 
               onClick={(e) => handleDownload(e, selectedImage)}
               className="btn btn-light rounded-pill px-4"
             >
               <Download size={18} className="me-2" /> Download High-Res
             </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
