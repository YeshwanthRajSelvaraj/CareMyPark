import React, { useState } from 'react';
import { reportService } from '../services/api';

const TrackReport = () => {
  const [referenceId, setReferenceId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!referenceId) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await reportService.getById(referenceId);
      // Backend returns { report: {...} }
      setReport(data.report);
    } catch (err) {
      console.error('Tracking error:', err);
      if (err.response && err.response.status === 404) {
        setError('Report not found. Please check your Reference ID.');
      } else if (err.response && err.response.status === 403) {
        setError('Access denied. You can only view your own reports.');
      } else {
        setError('Failed to track report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      'submitted': { color: 'warning', icon: '📝', label: 'Submitted' },
      'in_process': { color: 'info', icon: '⚙️', label: 'In Progress' },
      'resolved': { color: 'success', icon: '✅', label: 'Resolved' }
    };
    return statuses[status] || { color: 'secondary', icon: '❓', label: status };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">Track Your Report</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleTrack} className="mb-4">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter your Reference ID (e.g., CMP-20240115-ABC123)"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value.trim())}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading || !referenceId}
                  >
                    {loading ? 'Tracking...' : 'Track'}
                  </button>
                </div>
                <small className="text-muted">
                  Find your Reference ID in the confirmation email or message
                </small>
              </form>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {report && (
                <div className="tracking-results">
                  <h5>Report Status</h5>

                  <div className="card mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6>Reference ID</h6>
                          <h4><code>{report.reference_id}</code></h4>
                        </div>
                        <div className={`badge bg-${getStatusInfo(report.status).color} p-3`}>
                          <h5 className="mb-0">
                            {getStatusInfo(report.status).icon} {getStatusInfo(report.status).label}
                          </h5>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Problem Type:</strong> {report.problem_type}</p>
                          <p><strong>Description:</strong> {report.description}</p>
                          {report.is_anonymous && (
                            <span className="badge bg-secondary">Anonymous Report</span>
                          )}
                        </div>
                        <div className="col-md-6">
                          <p><strong>Submitted:</strong> {formatDate(report.created_at)}</p>
                          <p><strong>Last Updated:</strong> {formatDate(report.updated_at)}</p>
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div className="mt-4">
                        <h6>Status Timeline</h6>
                        <div className="timeline">
                          {/* Submitted Step */}
                          <div className="timeline-step">
                            <div className="timeline-step-circle bg-success">✓</div>
                            <div className="timeline-step-content">
                              <small>Submitted</small>
                              <p>{formatDate(report.created_at)}</p>
                            </div>
                          </div>

                          {/* In Process Step */}
                          <div className="timeline-step">
                            <div className={`timeline-step-circle bg-${['in_process', 'resolved'].includes(report.status) ? 'primary' : 'secondary'
                              }`}>
                              {['in_process', 'resolved'].includes(report.status) ? '•' : ''}
                            </div>
                            <div className="timeline-step-content">
                              <small>In Progress</small>
                            </div>
                          </div>

                          {/* Resolved Step */}
                          <div className="timeline-step">
                            <div className={`timeline-step-circle bg-${report.status === 'resolved' ? 'success' : 'secondary'
                              }`}>
                              {report.status === 'resolved' ? '✓' : ''}
                            </div>
                            <div className="timeline-step-content">
                              <small>Resolved</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h6>Need Help?</h6>
                <ul>
                  <li>Check your email for the Reference ID</li>
                  <li>Contact park authorities if you can't find your ID</li>
                  <li>Reference IDs are case-sensitive</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackReport;