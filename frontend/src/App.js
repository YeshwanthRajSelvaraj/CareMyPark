import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';

// Pages
import RegisterPage from './pages/RegisterPage';
import VisitorDashboard from './pages/VisitorDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import ReportPage from './pages/ReportPage';
import TrackReport from './pages/TrackReport';

// Home Component
const Home = () => (
  <div className="container mt-5">
    <div className="jumbotron bg-light p-5 rounded text-center">
      <h1 className="display-4 text-success">🌳 CareMyPark</h1>
      <p className="lead">Bridging Visitors & Authorities for Better Parks</p>
      <hr className="my-4" />
      <p>Report issues, track resolutions, and help maintain our beautiful parks</p>
      
      <div className="row mt-5">
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">🚨 Report Issues</h5>
              <p className="card-text">Found a problem in the park? Report it instantly with photos and location details.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">🔍 Track Status</h5>
              <p className="card-text">Use your unique Reference ID to track the status of your reports in real-time.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">👮 Authority Access</h5>
              <p className="card-text">Park authorities can manage, prioritize, and resolve reported issues efficiently.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <a href="/login" className="btn btn-primary btn-lg me-3">Get Started</a>
        <a href="/register" className="btn btn-outline-primary btn-lg">Register</a>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/track" element={<TrackReport />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <VisitorDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/authority" element={
          <PrivateRoute requiredRole="authority">
            <AuthorityDashboard />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;