import './AdminAccount.css';

import {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

function AdminAccount() {
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [employeeId, setEmployeeId] = useState(sessionStorage.getItem('employeeId'));

    // Fetch users and reports based on search term or selected employee ID
    useEffect(() => {
        fetchData(searchTerm);
    }, [searchTerm]);

    const fetchData = (term) => {
        // Fetch users based on search term
        axios.get(`http://localhost:5000/search/users?term=${term}`)
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the users!', error);
            });
    };

    const fetchReports = (userId) => {
        if (userId) {
            // Fetch reports for the selected employee when editing
            axios.get(`http://localhost:5000/reports?employeeId=${userId}`)
                .then(response => {
                    setReports(response.data);
                })
                .catch(error => {
                    console.error('There was an error fetching the reports for the selected employee!', error);
                });
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchClick = () => {
        fetchData(searchTerm);
    };

    const handleEdit = (user) => {
        // Clear previous reports before setting the new editing user
        setReports([]);
        // Set the editing user and pre-fill the edit form
        setEditingUser(user);
        setEditFormData(user);
        // Fetch reports for the selected employee after selecting for edit
        fetchReports(user.id);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleUpdateUser = () => {
        if (!editFormData.id) {
            alert("User ID is required.");
            return;
        }

        axios.put('http://localhost:5000/users/edit', editFormData)
            .then(response => {
                console.log('User updated successfully:', response.data);
                alert('User updated successfully!');
                fetchData(searchTerm);  // Refresh the user list
                setEditingUser(null);    // Clear the editing state
                setEditFormData({});     // Clear the form state
                setReports([]);          // Clear reports after updating
            })
            .catch(error => {
                let errorMessage = "An error occurred while updating the user. Please try again.";

                if (error.response) {
                    errorMessage = error.response.data.message || errorMessage;
                } else if (error.request) {
                    errorMessage = "No response from the server. Please check your internet connection.";
                } else {
                    errorMessage = error.message || errorMessage;
                }

                alert(errorMessage);
                console.error('Error updating user:', error);
            });
    };

    const handleDelete = (userId) => {
        axios.delete(`http://localhost:5000/users/${userId}`)
            .then(response => {
                console.log('User deleted successfully:', response.data);
                alert('User deleted successfully!');
                fetchData(searchTerm);  // Refresh the user list
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                alert("Error deleting user. Please try again.");
            });
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('employeeId');  // Clear employee ID during logout
        alert('Logged out successfully');
        window.location.href = '/#';
    };

    return (
        <div>
            <h2>Hello, Admin</h2>

            {/* Search Bar and Button */}
            <input
                type="text"
                placeholder="Search users or reports..."
                value={searchTerm}
                onChange={handleSearchChange}
            />
            <button onClick={handleSearchClick}>Search</button>

            <button onClick={handleLogout}>Logout</button>

            <div className="admin-container">
                {/* Users List */}
                <div className="users-list">
                    <h3>Users List</h3>
                    <ul>
                        {users.length > 0 ? (
                            users.map(user => (
                                <li key={user.id}>
                                    {user.firstName} {user.lastName} ({user.email}) - Role: {user.role}
                                    <button onClick={() => handleEdit(user)}>Edit</button>
                                    <button onClick={() => handleDelete(user.id)}>Delete</button>
                                </li>
                            ))
                        ) : (
                            <p>No users found</p>
                        )}
                    </ul>
                </div>

                {/* Edit User Form */}
                <div className="edit-user-form">
                    {editingUser && (
                        <div>
                            <h3>Edit User</h3>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="text"
                                    name="id"
                                    placeholder="User ID"
                                    value={editFormData.id || ''}
                                    onChange={handleEditChange}
                                />
                                <input
                                    type="text"
                                    name="employeeID"
                                    placeholder="Employee ID"
                                    value={editFormData.employeeID || ''}
                                    onChange={handleEditChange}
                                />
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={editFormData.firstName || ''}
                                    onChange={handleEditChange}
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={editFormData.lastName || ''}
                                    onChange={handleEditChange}
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={editFormData.email || ''}
                                    onChange={handleEditChange}
                                />
                                <input
                                    type="text"
                                    name="role"
                                    placeholder="Role"
                                    value={editFormData.role || ''}
                                    onChange={handleEditChange}
                                />
                                <input
                                    type="text"
                                    name="department"
                                    placeholder="Department"
                                    value={editFormData.department || ''}
                                    onChange={handleEditChange}
                                />
                                <button type="button" onClick={handleUpdateUser}>Update User</button>
                                <button type="button" onClick={() => setEditingUser(null)}>Cancel</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Reports List for Edited Employee */}
                <div className="reports-list">
                    <h3>Reports for {editingUser ? `${editingUser.firstName} ${editingUser.lastName}` : 'Employee'}</h3>
                    <ul>
                        {reports.length > 0 ? (
                            reports.map(report => (
                                <li key={report.id}>
                                    {report.name} - Status: {report.status}
                                </li>
                            ))
                        ) : (
                            <p>No reports found for the selected employee</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AdminAccount;
