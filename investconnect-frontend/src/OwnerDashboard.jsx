import { useState } from 'react';
import { Link } from 'react-router-dom';

const OwnerDashboard = () => {
  // Grab the user data we saved during login so we know WHO is posting the business
  const currentUser = JSON.parse(localStorage.getItem('investConnectUser')) || {};
  const OWNER_ID = currentUser.user ? currentUser.user.user_id : 1; // Default to 1 if not logged in

  const [businessData, setBusinessData] = useState({
    business_name: '',
    description: '',
    industry_category: 'Technology', // Default to the first of the 8 industries
    min_investment: '',
    annual_turnover: ''
  });

  const handleChange = (e) => {
    setBusinessData({ ...businessData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a FormData object (required for files)
    const formData = new FormData();
    formData.append('owner_id', OWNER_ID); 
    formData.append('business_name', businessData.business_name);
    formData.append('description', businessData.description);
    formData.append('industry_category', businessData.industry_category);
    formData.append('min_investment', businessData.min_investment);
    formData.append('annual_turnover', businessData.annual_turnover);
    
    // Grab the file from the input
    const fileInput = document.getElementById('pdfUpload');
    if (fileInput.files[0]) {
      formData.append('pitch_deck', fileInput.files[0]);
    }

    try {
      const res = await fetch('http://localhost:3000/api/businesses', {
        method: 'POST',
        body: formData // No headers needed, browser sets them for FormData!
      });
      
      if (res.ok) {
        alert("✅ Pitch and PDF uploaded successfully! Waiting for Admin Approval.");
        // Optional: clear the form here
      } else {
        const errData = await res.json();
        alert("❌ Error: " + errData.error);
      }
    } catch (err) {
      console.error("Error submitting pitch:", err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🏢 Business Owner Dashboard</h2>
        <Link to="/"><button style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button></Link>
      </div>

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '20px', color: '#000' }}>
        <h3 style={{ marginTop: 0 }}>Submit a New Business Pitch</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* ITEM 5: New Business Submission (Name & Description) */}
          <div>
            <label><strong>Business Name</strong></label>
            <input type="text" name="business_name" required onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </div>

          <div>
            <label><strong>Elevator Pitch (Description)</strong></label>
            <textarea name="description" rows="3" required onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}></textarea>
          </div>

          {/* ITEM 4: Industry Category Manager (8 Specific Industries) */}
          <div>
            <label><strong>Industry Category</strong></label>
            <select 
    name="industry_category"
    required
    style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
>
    <option value="">-- Select Industry --</option>
    <option value="Technology">Technology</option>
    <option value="Real Estate">Real Estate</option>
    <option value="Medicine & Healthcare">Medicine & Healthcare</option>
    <option value="Retail & E-commerce">Retail & E-commerce</option>
    <option value="Energy & Sustainability">Energy & Sustainability</option>
    <option value="Agriculture & Food">Agriculture & Food</option>
    <option value="Finance & FinTech">Finance & FinTech</option>
    <option value="Entertainment & Media">Entertainment & Media</option>
</select>
          </div>

          {/* ITEM 6: Financial Data Input */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label><strong>Minimum Investment Required ($)</strong></label>
              <input type="number" name="min_investment" required onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label><strong>Annual Profit/Turnover ($)</strong></label>
              <input type="number" name="annual_turnover" required onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
            </div>
          </div>

          {/* 🚀 FIXED: The PDF File Upload Button is now inside the visible form! */}
          <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '5px', border: '1px dashed #ccc' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}><strong>📄 Attach Pitch Deck (PDF)</strong></label>
            <input type="file" id="pdfUpload" accept=".pdf" />
          </div>

          <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', marginTop: '10px', fontWeight: 'bold' }}>
            Submit Business Pitch
          </button>
        </form>
      </div>
    </div>
  );
};

export default OwnerDashboard;