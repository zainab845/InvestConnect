import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [pendingPitches, setPendingPitches] = useState([]);

  // Fetch only unapproved businesses
  const fetchPending = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/pending');
      const data = await response.json();
      setPendingPitches(data);
    } catch (err) {
      console.error("Failed to fetch pending pitches", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Function to approve a business
  const handleApprove = async (businessId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/approve/${businessId}`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("✅ " + data.message);
        fetchPending(); // Refresh the list so the approved one disappears!
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      console.error("Approval failed", err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🛡️ Admin Control Panel</h2>
        <Link to="/"><button>Logout</button></Link>
      </div>

      <p>Review and approve newly submitted business pitches before they go live on the Investor Feed.</p>

      {pendingPitches.length === 0 ? (
        <div style={{ padding: '20px', background: '#d4edda', color: '#155724', borderRadius: '5px' }}>
          <strong>All caught up!</strong> There are no pending pitches waiting for approval.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {pendingPitches.map((pitch) => (
            <div key={pitch.business_id} style={{ border: '2px solid #ffc107', padding: '15px', borderRadius: '8px', background: '#fffdf7' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{pitch.business_name}</h3>
              <p><strong>Owner Email:</strong> {pitch.Owner_Email}</p>
              <p><strong>Submitted On:</strong> {new Date(pitch.created_at).toLocaleDateString()}</p>
              
              <button 
                onClick={() => handleApprove(pitch.business_id)}
                style={{ marginTop: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✅ Approve & Publish
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;