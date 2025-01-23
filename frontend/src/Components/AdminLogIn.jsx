import './LoginRegister.css';

import React, { useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [showPassword, setShowPassword] = useState(false);  // State to toggle password visibility
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const navigate = useNavigate();  // Hook to navigate between pages

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/login', formData);
            alert(response.data.message);

            if (response.data.message === 'Login successful') {
                const { role } = response.data;

                // Role-based navigation after successful login
                if (role === 'admin') {
                    navigate('/adminaccount'); // Navigate to admin page
                } else {
                    alert('Invalid login type');
                }
            }
        } catch (error) {
            alert('Login failed');
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="wrapper">
            {/* Login Form */}
            <div className="form-box login">
                <form onSubmit={handleLogin}>
                    <h1>Admin Login</h1>
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
                        <a href="##">Forgot Password?</a>
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;