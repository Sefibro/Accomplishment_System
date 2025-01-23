import './LoginRegister.css';

import React, { useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginRegister = () => {
    const [action, setAction] = useState('');  // State to switch between login and register
    const [showPassword, setShowPassword] = useState(false);  // State to toggle password visibility
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',  // Default role for registration
        employeeID: '',
        firstName: '',
        lastName: '',
        department: ''
    });
    const navigate = useNavigate();  // Hook to navigate between pages

    const registerLink = () => {
        setAction(' active');
        // Only reset the fields that are specific to the registration form
        setFormData({ 
            email: formData.email, // Keep the email field value
            password: '', 
            confirmPassword: '', 
            role: 'employee',  // Default role
            employeeID: '', 
            firstName: '', 
            lastName: '', 
            department: '' 
        });
    };

    const loginLink = () => {
        setAction('');
        // Clear only the registration-specific fields
        setFormData({ 
            email: '', 
            password: '', 
            confirmPassword: '', 
            role: 'employee', 
            employeeID: '', 
            firstName: '', 
            lastName: '', 
            department: '' 
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    // 1/23/2025
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/login', formData);
            alert(response.data.message);
    
            if (response.data.message === 'Login successful') {
                const { role } = response.data;
    
                // Prevent admin from logging in
                if (role === 'admin') {
                    alert('Admin login is not allowed from this form.');
                    return;
                }
    
                // Role-based navigation after successful login
                if (role === 'employee') {
                    navigate('/useraccount'); // Navigate to employee page
                } else if (role === 'moderator') {
                    navigate('/modsaccount'); // Navigate to moderator page
                } else {
                    alert('Invalid login type');
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                // Handle account lock
                alert(error.response.data.message);
            } else {
                alert('Login failed');
            }
        }
    };
    


    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/register', formData);
            alert(response.data.message);

            if (response.data.message === 'Registration successful') {
                // After successful registration, switch to login form
                loginLink();
                navigate('/'); // Redirect to login page after registration
            }
        } catch (error) {
            alert('Registration failed');
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={`wrapper${action}`}>
            {/* Employee Login Form */}
            <div className="form-box login">
                <form onSubmit={handleLogin}>
                    <h1>Employee Login</h1>
                    <div className="input-box">
                        <input 
                            type="text" 
                            name="email" 
                            placeholder="Email" 
                            value={formData.email}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            name="password"
                            placeholder="Password" 
                            value={formData.password}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" onChange={toggleShowPassword} /> Show Password
                        </label>
                        <a href="#">Forgot Password?</a>
                    </div>
                    <button type="submit">Login</button>
                    <div className="register-link">
                        <p>Don't have an account? 
                            <a href="#" onClick={registerLink}> Register</a>
                        </p>
                    </div>
                </form>
            </div>

            {/* Registration Form */}
            <div className="form-box register">
                <form onSubmit={handleRegister}>
                    <h1>Registration</h1>
                    <div className="input-box">
                        <input 
                            type="text" 
                            name="employeeID" 
                            placeholder="Employee ID" 
                            value={formData.employeeID}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type="text" 
                            name="firstName" 
                            placeholder="First Name" 
                            value={formData.firstName}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type="text" 
                            name="lastName" 
                            placeholder="Last Name" 
                            value={formData.lastName}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Email" 
                            value={formData.email}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type="text" 
                            name="department" 
                            placeholder="Department" 
                            value={formData.department}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Password" 
                            value={formData.password}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            placeholder="Confirm Password" 
                            value={formData.confirmPassword}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <span>Register as:</span>
                        <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange} 
                            required
                        >
                            <option value="employee">Employee</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" required /> I agree with terms & conditions
                        </label>
                    </div>
                    <button type="submit">Register</button>
                    <div className="register-link">
                        <p>Already have an account? 
                            <a href="#" onClick={loginLink}> Login</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginRegister;