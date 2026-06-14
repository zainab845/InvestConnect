import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        // 1. Save their "Virtual ID Badge"
        localStorage.setItem('investConnectUser', JSON.stringify(data.user));
        
        alert(`Welcome back! Logged in as: ${data.user.role_type}`);
        
        // 2. THE TRAFFIC COP: Send them to their specific dashboard!
        if (data.user.role_type === 'Investor') {
          navigate('/investor-dashboard'); 
        } else if (data.user.role_type === 'Owner') {
          navigate('/owner-dashboard');
        }
      } else {
        // If password is wrong or email doesn't exist
        alert('❌ Login failed: ' + data.error);
      }
    } catch (err) {
      console.error("Error:", err);
      alert('Failed to connect to the server.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>InvestConnect Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="email" 
          name="email" 
          placeholder="Email Address" 
          required 
          onChange={handleChange} 
          style={{ padding: '8px' }}
        />
        
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          required 
          onChange={handleChange} 
          style={{ padding: '8px' }}
        />

        <button type="submit" style={{ padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Log In
        </button>
      </form>

      <p style={{ marginTop: '20px', fontSize: '14px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;