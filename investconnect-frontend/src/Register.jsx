import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  
  // 1. The State to hold what the user types
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    role_type: 'Investor' // Default selection
  });

  // 2. Function to update state when typing
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. The Submit Function (Talking to our Node backend)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from reloading
    
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        alert('🎉 Account created successfully! You can now log in.');
        navigate('/'); // Send them back to the login page
      } else {
        alert('❌ Registration failed: ' + data.error);
      }
    } catch (err) {
      console.error("Error:", err);
      alert('Failed to connect to the server.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>Create an Account</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Role Selection */}
        <div>
          <label><strong>I am signing up as a:</strong></label>
          <select 
            name="role_type" 
            value={formData.role_type} 
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="Investor">Investor</option>
            <option value="Owner">Business Owner</option>
          </select>
        </div>

        {/* Input Fields */}
        <input type="text" name="first_name" placeholder="First Name" required onChange={handleChange} style={{ padding: '8px' }}/>
        <input type="text" name="last_name" placeholder="Last Name" required onChange={handleChange} style={{ padding: '8px' }}/>
        <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} style={{ padding: '8px' }}/>
        <input type="text" name="phone_number" placeholder="Phone Number" onChange={handleChange} style={{ padding: '8px' }}/>
        <input type="password" name="password" placeholder="Secure Password" required onChange={handleChange} style={{ padding: '8px' }}/>

        <button type="submit" style={{ padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Register Now
        </button>
      </form>

      <p style={{ marginTop: '20px', fontSize: '14px' }}>
        Already have an account? <Link to="/">Log in here</Link>
      </p>
    </div>
  );
};

export default Register;