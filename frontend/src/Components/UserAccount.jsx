import './UserAccount.css';

import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

const UserAccount = () => {
  const [name, setName] = useState('');
  const [report, setReport] = useState('');
  const [submittedData, setSubmittedData] = useState([]);
  const [editReport, setEditReport] = useState({}); // State for editing a rejected report

  useEffect(() => {
    // Fetch previously submitted reports when the component mounts
    const fetchSubmittedData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/reports');
        setSubmittedData(response.data);
      } catch (error) {
        console.error('Error fetching submitted reports:', error);
      }
    };
    fetchSubmittedData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = { firstName: name, report };

    try {
      // First, check if the firstName exists in the database
      const checkResponse = await axios.get(`http://localhost:5000/search/users?term=${name}`);
      
      if (checkResponse.data.length === 0) {
        alert('First Name not found in the database!');
        return;
      }

      // If the firstName exists, submit the report
      const response = await axios.post('http://localhost:5000/submit', formData);

      if (response.data.message === 'Report submitted successfully') {
        alert('Data submitted successfully!');
        setSubmittedData([...submittedData, formData]);
        setName('');
        setReport('');
      } else {
        alert('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred, please try again.');
    }
  };

  const handleEditChange = (e, id) => {
    setEditReport({ ...editReport, [id]: { ...editReport[id], report: e.target.value } });
  };

  const handleEditSubmit = async (id) => {
    try {
      const response = await axios.put(`http://localhost:5000/reports/${id}/edit`, {
        report: editReport[id].report,
      });
      if (response.data.message === 'Report updated successfully') {
        alert('Report updated successfully!');
        const updatedReports = submittedData.map((data) => (data.id === id ? { ...data, report: editReport[id].report } : data));
        setSubmittedData(updatedReports);
        setEditReport((prev) => ({ ...prev, [id]: undefined })); // Clear the edit state
      } else {
        alert('Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('An error occurred, please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    alert('Logged out successfully');
    window.location.href = '/#';
  };

  return (
    <div className="user-account-container">
      <div className="form-container">
        <h1>Submit Your Report</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <label>First Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your first name"
              required
            />
          </div>
          <div className="input-container">
            <label>Report:</label>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Enter Report"
              required
            />
          </div>
          <button type="submit">Submit</button>
          <button type="button" onClick={handleLogout}>Logout</button>
        </form>
      </div>

      {/* Displaying Submitted Data in a Table */}
      {submittedData.length > 0 && (
        <div className="submitted-data-container">
          <h2>Submitted Reports</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Report</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submittedData.map((data, index) => (
                <tr key={index}>
                  <td>{data.name}</td>
                  <td>
                    {data.status === 'rejected' && editReport[data.id] ? (
                      <textarea
                        value={editReport[data.id].report}
                        onChange={(e) => handleEditChange(e, data.id)}
                      />
                    ) : (
                      data.report
                    )}
                  </td>
                  <td>{data.status}</td>
                  <td>
                    {data.status === 'rejected' ? (
                      editReport[data.id] ? (
                        <button onClick={() => handleEditSubmit(data.id)}>Save</button>
                      ) : (
                        <button onClick={() => setEditReport({ ...editReport, [data.id]: data })}>
                          Edit
                        </button>
                      )
                    ) : (
                      'No actions available'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserAccount;
