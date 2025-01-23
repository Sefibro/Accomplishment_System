import './ModsAccount.css';

import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

const ModsAccount = () => {
  const [logs, setLogs] = useState([]); // State to store logs/reports

  // Fetch logs/reports from the backend when the component mounts
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:5000/reports'); // Fetch reports
        setLogs(response.data); // Update state with fetched reports
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, []);

  // Approve a report
  const handleApprove = async (reportId) => {
    try {
      await axios.put(`http://localhost:5000/reports/${reportId}/approve`); // Update report status to approved
      alert('Report approved');
      setLogs(logs.filter((log) => log.id !== reportId)); // Remove from UI after approval
    } catch (error) {
      console.error('Error approving report:', error);
      alert('Failed to approve report');
    }
  };

  // Reject a report
  const handleReject = async (reportId) => {
    try {
      await axios.put(`http://localhost:5000/reports/${reportId}/reject`); // Update report status to rejected
      alert('Report rejected');
      setLogs(logs.filter((log) => log.id !== reportId)); // Remove from UI after rejection
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('Failed to reject report');
    }
  };

  // Logout function
  const handleLogout = () => {
    sessionStorage.removeItem('authToken'); // Adjust according to your session management
    alert('Logged out successfully');
    window.location.href = '/#'; // Redirect to login page after logout
  };

  return (
    <div className="container">
      <div className="mods-account">
        <h1>Employee Reports</h1>
        <div className="employee-logs">
          {logs.map((log) => (
            <div className="employee-log" key={log.id}>
              <div className="employee-header">
                <div className="employee-avatar" />
                <span>{log.name}</span> {/* Display employee's name */}
              </div>
              <div className="employee-message">
                <p>{log.report}</p> {/* Display employee's report */}
              </div>
              <div className="employee-actions">
                <button className="action-btn approve" onClick={() => handleApprove(log.id)}>✔️ Approve</button>
                <button className="action-btn reject" onClick={() => handleReject(log.id)}>❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default ModsAccount;
