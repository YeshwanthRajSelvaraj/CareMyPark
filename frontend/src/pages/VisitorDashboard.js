import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';

const VisitorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportService.getAll();
        // Backend returns { reports: [...] }
        setReports(data.reports || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching reports:', err);
        if (err.response && err.response.status === 401) {
          // Auto-redirect to login without error message
          navigate('/login');
        } else {
          setError('Failed to load reports. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const getStatusBadge = (status) => {
    const colors = {
      'submitted': 'warning',
      'in_process': 'info',
      'resolved': 'success'
    };
    // Format status label: 'in_process' -> 'In Process'
    const label = status ? status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') : status;

    return (
      <span className={`badge bg-${colors[status] || 'secondary'}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="container mt-4">
      <h2>Your Dashboard</h2>
      <p>Track and manage your park reports</p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Your Reports</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-3">
                  <p>No reports submitted yet.</p>
                  <Link to="/report" className="btn btn-primary btn-sm">
                    Submit Your First Report
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Reference ID</th>
                        <th>Problem Type</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.reference_id}>
                          <td><code>{report.reference_id}</code></td>
                          <td>{report.problem_type}</td>
                          <td>
                            {report.description.length > 50
                              ? `${report.description.substring(0, 50)}...`
                              : report.description}
                          </td>
                          <td>{getStatusBadge(report.status)}</td>
                          <td>{new Date(report.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <Link to="/report" className="btn btn-primary w-100 mb-2">
                Submit New Report
              </Link>
              <Link to="/track" className="btn btn-outline-primary w-100 mb-2">
                Track Existing Report
              </Link>
              <button className="btn btn-outline-secondary w-100">
                View Park Guidelines
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Stats</h5>
            </div>
            <div className="card-body">
              <p>Total Reports: {reports.length}</p>
              <p>Resolved: {reports.filter(r => r.status === 'resolved').length}</p>
              <p>In Progress: {reports.filter(r => r.status === 'in_process').length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDashboard;