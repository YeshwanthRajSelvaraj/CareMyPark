import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Button, Card, Container, Row, Col, Form, Spinner, Alert } from 'react-bootstrap';
import { reportService } from '../services/api';

const AuthorityDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    problem_type: ''
  });
  const [sStats, setStats] = useState({
    total: 0,
    submitted: 0,
    in_process: 0,
    resolved: 0
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch reports with current filters
      const data = await reportService.getAll(filters);
      const reportsList = data.reports || [];
      setReports(reportsList);

      // Calculate basic stats for cards
      setStats({
        total: reportsList.length,
        submitted: reportsList.filter(r => r.status === 'submitted').length,
        in_process: reportsList.filter(r => r.status === 'in_process').length,
        resolved: reportsList.filter(r => r.status === 'resolved').length
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleStatusUpdate = async (referenceId, newStatus) => {
    try {
      await reportService.updateStatus(referenceId, newStatus);
      // Refresh list after update
      fetchReports();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Helper for filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      submitted: 'warning',
      in_process: 'info',
      resolved: 'success'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status?.replace(/_/g, ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'success',
      medium: 'warning',
      high: 'danger'
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority?.toUpperCase()}</Badge>;
  };

  if (loading && reports.length === 0) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Park Authority Dashboard</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-white bg-primary h-100">
            <Card.Body>
              <h5>Total Reports</h5>
              <h2>{sStats.total}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-warning h-100">
            <Card.Body>
              <h5>Submitted</h5>
              <h2>{sStats.submitted}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-info h-100">
            <Card.Body>
              <h5>In Process</h5>
              <h2>{sStats.in_process}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-success h-100">
            <Card.Body>
              <h5>Resolved</h5>
              <h2>{sStats.resolved}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_process">In Process</option>
                  <option value="resolved">Resolved</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Problem Type</Form.Label>
                <Form.Select
                  value={filters.problem_type}
                  onChange={(e) => handleFilterChange('problem_type', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Litter">Litter</option>
                  <option value="Damaged Equipment">Damaged Equipment</option>
                  <option value="Safety Hazard">Safety Hazard</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button
                variant="secondary"
                onClick={() => setFilters({ status: '', problem_type: '' })}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Reports Table */}
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Reports ({reports.length})</h5>
            <Button variant="outline-primary" size="sm" onClick={fetchReports}>Refresh Data</Button>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No reports found matching criteria
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Reference ID</th>
                    <th>User Email</th>
                    <th>Problem Type</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.reference_id}>
                      <td><code>{report.reference_id}</code></td>
                      <td>{report.user_email}</td>
                      <td>{report.problem_type}</td>
                      <td>
                        {report.description.length > 50
                          ? `${report.description.substring(0, 50)}...`
                          : report.description}
                      </td>
                      <td>{getPriorityBadge(report.priority)}</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>{new Date(report.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-2">
                          {report.status === 'submitted' && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleStatusUpdate(report.reference_id, 'in_process')}
                            >
                              Start Process
                            </Button>
                          )}
                          {report.status === 'in_process' && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => handleStatusUpdate(report.reference_id, 'resolved')}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuthorityDashboard;