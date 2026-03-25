import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import SelfieUploader from '../components/SelfieUploader';
import PhotoGallery from '../components/PhotoGallery';
import { compressImageForUpload } from '../utils/imageUpload';

const EventPage = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [matches, setMatches] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoadingEvent(true);
      const res = await api.get(`/events/${eventId}/`);
      setEventData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleSelfieUpload = async (file) => {
    if (!file) return;

    setIsSearching(true);
    setSearchError('');
    setMatches(null);

    try {
      // Compress the selfie right before searching to improve upload speeds dynamically!
      const compressedSelfie = await compressImageForUpload(file);

      const formData = new FormData();
      formData.append('selfie', compressedSelfie);

      const res = await api.post(`/events/${eventId}/search-face/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMatches(res.data.matched_photos || []);
    } catch (err) {
      console.error(err);
      setSearchError(err.response?.data?.error || 'Failed to search photos. Try again.');
    } finally {
      setIsSearching(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="event-page container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading event...</span>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="event-page container py-5 text-center">
        <h2 className="text-dark">Event not found.</h2>
        <p className="text-muted">The link might be invalid or the event has been removed.</p>
      </div>
    );
  }

  return (
    <div className="event-page py-5">
      <div className="container">
        <div className="event-hero reveal">
          <span className="home-badge mb-3">
            {new Date(eventData.event_date).toLocaleDateString()}
          </span>
          <h1>{eventData.name}</h1>
          <p>
            Welcome. Upload a quick selfie and our AI engine will instantly find every photo
            where you appear in this event gallery.
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-7 mb-5">
            <SelfieUploader
              onUpload={handleSelfieUpload}
              isLoading={isSearching}
              uploadError={searchError}
            />
          </div>
        </div>

        {matches !== null && (
          <div className="matches-wrap mt-4 pt-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 className="fw-semibold m-0 d-flex align-items-center">
                Your Matches
                <span className="badge bg-primary ms-3 rounded-pill fs-6">{matches.length}</span>
              </h3>
            </div>
            <PhotoGallery photos={matches} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPage;
