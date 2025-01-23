const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: '3306',
    database: 'accomplishment_db' // Your database name
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Encryption and Decryption settings
const algorithm = 'aes-256-cbc'; // AES encryption algorithm
const key = crypto.randomBytes(32); // Generate a secure encryption key
const iv = crypto.randomBytes(16); // Initialization vector for encryption

// Function to encrypt text (e.g., email)
function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt text (e.g., email)
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}


// 1/23/2025
app.post('/register', async (req, res) => {
    const { employeeID, firstName, lastName, email, department, password, role } = req.body;

    // Check if employeeID is a valid number (only digits)
    if (!/^\d+$/.test(employeeID)) {
        return res.status(400).json({ message: 'Employee ID must be a valid number.' });
    }

    // Password validation: at least 5 characters, 3 numbers, 2 letters
    const passwordPattern = /^(?=.*[0-9].*[0-9].*[0-9])(?=.*[A-Za-z].*[A-Za-z]).{5,}$/;
    if (!passwordPattern.test(password)) {
        return res.status(400).json({ 
            message: 'Password must be at least 5 characters long and contain at least 3 numbers and 2 letters.' 
        });
    }

    // Encrypt the password and other fields
    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptedFirstName = encrypt(firstName);
    const encryptedLastName = encrypt(lastName);
    const encryptedDepartment = encrypt(department);
    const encryptedEmail = encrypt(email); // Encrypt email too

    // Insert data into the users table
    const query = 'INSERT INTO users (employeeID, firstName, lastName, email, department, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [employeeID, encryptedFirstName, encryptedLastName, encryptedEmail, encryptedDepartment, hashedPassword, role], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Registration failed', error: err });
        }
        return res.status(200).json({ message: 'Registration successful', role });
    });
});





// 1/23/2025
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Query to check credentials
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [encrypt(email)], async (err, results) => {  // Encrypt email before querying
        if (err) {
            return res.status(500).json({ message: 'Login failed', error: err });
        } else if (results.length > 0) {
            const user = results[0];
            const userRole = user.role; // Fetch role from the database
            const failedAttempts = user.failed_attempts;
            const lockUntil = user.lock_until;
            const currentTime = new Date();

            // Check if the account is locked
            if (lockUntil && currentTime < new Date(lockUntil)) {
                return res.status(403).json({
                    message: 'Account is locked. Try again later.',
                    lockUntil: lockUntil,
                });
            }

            // Compare the password with the hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                // Reset failed attempts on successful login
                const resetAttemptsQuery = 'UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE email = ?';
                db.query(resetAttemptsQuery, [encrypt(email)]);

                return res.status(200).json({ message: 'Login successful', role: userRole });
            } else {
                // Increment failed attempts
                const newFailedAttempts = failedAttempts + 1;

                let lockQuery = '';
                let lockParams = [];

                // If 5 failed attempts, lock the account for 15 minutes
                if (newFailedAttempts >= 5) {
                    const lockTime = new Date(currentTime.getTime() + 15 * 60000); // Lock for 15 minutes
                    lockQuery = 'UPDATE users SET failed_attempts = ?, lock_until = ? WHERE email = ?';
                    lockParams = [newFailedAttempts, lockTime, encrypt(email)];
                } else {
                    lockQuery = 'UPDATE users SET failed_attempts = ? WHERE email = ?';
                    lockParams = [newFailedAttempts, encrypt(email)];
                }

                db.query(lockQuery, lockParams, (lockErr) => {
                    if (lockErr) {
                        return res.status(500).json({ message: 'Login failed', error: lockErr });
                    }

                    return res.status(400).json({
                        message: 'Invalid credentials',
                        failedAttempts: newFailedAttempts,
                        remainingAttempts: 5 - newFailedAttempts,
                    });
                });
            }
        } else {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
    });
});






// Search Users route - Now supports searching by employeeID, firstName, or lastName
app.get('/search/users', (req, res) => {
    const searchTerm = req.query.term;
    const query = `
        SELECT * FROM users 
        WHERE employeeID LIKE ? 
        OR firstName LIKE ? 
        OR lastName LIKE ?`;

    db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching users', error: err });
        }
        return res.status(200).json(results); // Return the filtered users
    });
});

// 1/23/2025
app.put('/users/edit', (req, res) => {
    const { id, employeeID, firstName, lastName, email, role, department } = req.body;

    if (!id || !employeeID || !firstName || !lastName || !email || !role || !department) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (!/^\d+$/.test(employeeID)) {
        return res.status(400).json({ message: 'Employee ID must be a valid number.' });
    }

    // Encrypt new data
    const encryptedFirstName = encrypt(firstName);
    const encryptedLastName = encrypt(lastName);
    const encryptedDepartment = encrypt(department);
    const encryptedEmail = encrypt(email); // Encrypt email as well

    const query = `UPDATE users SET 
        employeeID = ?, 
        firstName = ?, 
        lastName = ?, 
        email = ?, 
        role = ?, 
        department = ?  
        WHERE id = ?`;

    db.query(query, [employeeID, encryptedFirstName, encryptedLastName, encryptedEmail, role, encryptedDepartment, id], (error, result) => {
        if (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({ message: "Error updating user" });
        }
        return res.status(200).json({ message: "User updated successfully" });
    });
});

// Delete user route
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'DELETE FROM users WHERE id = ?';

    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to delete user', error: err });
        }

        // If no rows are affected, the user was not found
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    });
});

// Submit report route
// Submit report route with firstName validation
app.post('/submit', (req, res) => {
    const { firstName, report } = req.body;

    // Validate that both firstName and report are provided
    if (!firstName || !report) {
        return res.status(400).json({ message: 'First Name and report are required.' });
    }

    // Check if the first name exists in the users table
    const query = 'SELECT * FROM users WHERE firstName = ?';

    db.query(query, [firstName], (err, results) => {
        if (err) {
            console.error('Error checking firstName:', err);
            return res.status(500).json({ message: 'Error checking first name', error: err });
        }

        // If first name does not exist, return an error
        if (results.length === 0) {
            return res.status(404).json({ message: 'First name not found' });
        }

        // If first name exists, insert the report into the user_details table
        const insertQuery = 'INSERT INTO user_details (name, report) VALUES (?, ?)';
        db.query(insertQuery, [firstName, report], (err, result) => {
            if (err) {
                console.error('Error inserting report:', err);
                return res.status(500).json({ message: 'Failed to submit report', error: err });
            }
            return res.status(200).json({ message: 'Report submitted successfully' });
        });
    });
});


// Get all reports route with name filtering
app.get('/reports', (req, res) => {
    const { name } = req.query; // Filter reports by name

    const query = name ? 
        'SELECT * FROM user_details WHERE name LIKE ?' : 
        'SELECT * FROM user_details';

    db.query(query, name ? [`%${name}%`] : [], (err, results) => {
        if (err) {
            console.error('Error fetching reports:', err);
            return res.status(500).json({ message: 'Failed to fetch reports', error: err });
        }
        return res.status(200).json(results); // Return the filtered reports
    });
});

// Approve a report
app.put('/reports/:id/approve', (req, res) => {
    const reportId = req.params.id;
    const query = 'UPDATE user_details SET status = "approved" WHERE id = ?'; // Update report status to 'approved'

    db.query(query, [reportId], (err, result) => {
        if (err) {
            console.error('Error approving report:', err);
            return res.status(500).json({ message: 'Failed to approve report', error: err });
        }
        return res.status(200).json({ message: 'Report approved' });
    });
});

// Reject a report
app.put('/reports/:id/reject', (req, res) => {
    const reportId = req.params.id;
    const query = 'UPDATE user_details SET status = "rejected" WHERE id = ?'; // Update report status to 'rejected'

    db.query(query, [reportId], (err, result) => {
        if (err) {
            console.error('Error rejecting report:', err);
            return res.status(500).json({ message: 'Failed to reject report', error: err });
        }
        return res.status(200).json({ message: 'Report rejected' });
    });
});

// Edit a rejected report
app.put('/reports/:id/edit', (req, res) => {
    const reportId = req.params.id;
    const { report } = req.body;

    // Validate that report is provided
    if (!report) {
        return res.status(400).json({ message: 'Report content is required.' });
    }

    const query = 'UPDATE user_details SET report = ? WHERE id = ? AND status = "rejected"';
    db.query(query, [report, reportId], (err, result) => {
        if (err) {
            console.error('Error updating report:', err);
            return res.status(500).json({ message: 'Failed to update report', error: err });
        }

        // If no rows are affected, the report was not found or was not rejected
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Rejected report not found or already approved' });
        }

        return res.status(200).json({ message: 'Report updated successfully' });
    });
});

// Get Reports of employee based on admin email
app.get('/admin/reports', (req, res) => {
    const { email } = req.query; // Admin's email is passed as a query parameter

    // First, check if the user is an admin
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking admin role', error: err });
        } else if (results.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        } else {
            const user = results[0];
            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Unauthorized access' });
            }

            // Now, fetch reports for employees under this admin
            const employeeQuery = 'SELECT * FROM user_details WHERE employeeID IN (SELECT employeeID FROM users WHERE role = "employee" AND managerID = ?)';

            db.query(employeeQuery, [user.id], (err, reports) => {
                if (err) {
                    return res.status(500).json({ message: 'Error fetching reports', error: err });
                }
                return res.status(200).json(reports); // Return employee reports
            });
        }
    });
});

// 1/23/2025
app.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to fetch users', error: err });
        }

        // Decrypt the necessary fields before sending back the data
        const decryptedUsers = results.map(user => ({
            ...user,
            firstName: decrypt(user.firstName),
            lastName: decrypt(user.lastName),
            department: decrypt(user.department),
            email: decrypt(user.email) // Decrypt email too
        }));

        return res.status(200).json(decryptedUsers);
    });
});



// Start the server
const port = 5000;
app.listen(port, () => {
    console.log("Server running on port 5000");
});