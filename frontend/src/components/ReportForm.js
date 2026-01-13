import React, { useState } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { reportAPI } from '../services/api';
import Swal from 'sweetalert2';

const problemTypes = [
  { value: 'litter', label: 'Litter/Garbage' },
  { value: 'damage', label: 'Damaged Equipment' },
  { value: 'safety', label: 'Safety Concern' },
  { value: 'maintenance', label: 'Maintenance Needed' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'other', label: 'Other' },
];

const ReportForm = ({ location }) => {
  const [formData, setFormData] = useState({
    problem_type: '',
    description: '',
    location: location || '',
    is_anonymous: false,
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.problem_type || !formData.description) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });
      
      photos.forEach(photo => {
        formDataObj.append('photos', photo);
      });

      const response = await reportAPI.createReport(formDataObj);
      
      Swal.fire({
        title: 'Report Submitted!',
        html: `
          <p>Your report has been submitted successfully.</p>
          <p><strong>Reference ID:</strong> ${response.data.reference_id}</p>
          <p>Use this ID to track your report status.</p>
        `,
        icon: 'success',
        confirmButtonText: 'OK'
      });

      // Reset form
      setFormData({
        problem_type: '',
        description: '',
        location: location || '',
        is_anonymous: false,
      });
      setPhotos([]);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">Report an Issue</h4>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Problem Type *</Form.Label>
            <Form.Select
              name="problem_type"
              value={formData.problem_type}
              onChange={handleChange}
              required
            >
              <option value="">Select a problem type</option>
              {problemTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Where is the issue located?"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Please describe the issue in detail..."
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Upload Photos (Optional)</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <Form.Text muted>
              Upload up to 5 photos to help us understand the issue better
            </Form.Text>
            {photos.length > 0 && (
              <div className="mt-2">
                <small>Selected: {photos.length} file(s)</small>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_anonymous"
              label="Report anonymously"
              checked={formData.is_anonymous}
              onChange={handleChange}
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReportForm;