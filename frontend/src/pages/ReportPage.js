import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';
import Swal from 'sweetalert2';

const ReportPage = () => {
  const [formData, setFormData] = useState({
    problemType: '',
    description: '',
    location: '',
    photos: null,
    isAnonymous: false
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Auto-redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      photos: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create FormData object for file upload
      const data = new FormData();
      data.append('problem_type', formData.problemType);
      data.append('description', formData.description);
      data.append('location', formData.location);
      data.append('is_anonymous', formData.isAnonymous);

      if (formData.photos) {
        data.append('photos', formData.photos);
      }

      const response = await reportService.create(data);

      // Success alert with Reference ID
      await Swal.fire({
        title: 'Report Submitted!',
        text: `Your Reference ID: ${response.reference_id}`,
        icon: 'success',
        confirmButtonText: 'Great!'
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Submission error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to submit report. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const problemTypes = [
    'Litter/Garbage',
    'Damaged Equipment',
    'Safety Concern',
    'Vandalism',
    'Maintenance Needed',
    'Other'
  ];

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Report an Issue</h4>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Found an issue in the park? Report it here and help us keep our parks clean and safe.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Problem Type *</label>
                  <select
                    className="form-select"
                    name="problemType"
                    value={formData.problemType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a problem type</option>
                    {problemTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Near playground, Main entrance, etc."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Please describe the issue in detail..."
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Upload Photo (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <small className="text-muted">
                    Upload a photo to help us understand the issue better
                  </small>
                </div>

                <div className="mb-4 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="anonymousCheck"
                    name="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="anonymousCheck">
                    Submit Anonymously
                  </label>
                  <div className="form-text">
                    Your name/email won't be visible to park authorities for this report.
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;