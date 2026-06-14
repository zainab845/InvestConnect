import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


const InvestorDashboard = () => {

  // Hardcoded back to User 2 so it works perfectly without the login screen!
  const INVESTOR_ID = 2; 

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState({ id: null, data: [] });
  const [searchTerm, setSearchTerm] = useState('');

  // Profile & Matching State
  const [profile, setProfile] = useState({ first_name: '', last_name: '', min_budget: 0, max_budget: 9999999, preferred_industry: 'All' });
  const [showMatchesOnly, setShowMatchesOnly] = useState(false); // The Toggle!
  
  // 🚀 NEW: Watchlist State
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false); 
  const [savedBusinessIds, setSavedBusinessIds] = useState([]); 

  // 1. Fetch Profile, Businesses, & Watchlist on Load
  useEffect(() => {
    const loadData = async () => {
      try {
        // Grab the Investor's Profile
        const profileRes = await fetch(`http://localhost:3000/api/investors/${INVESTOR_ID}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // 🚀 NEW: Grab the Investor's Watchlist IDs
        const watchRes = await fetch(`http://localhost:3000/api/investors/${INVESTOR_ID}/watchlist`);
        if (watchRes.ok) {
          const watchData = await watchRes.json();
          setSavedBusinessIds(watchData);
        }

        // Grab the Businesses
        const bizRes = await fetch('http://localhost:3000/api/businesses');
        const bizData = await bizRes.json();
        setBusinesses(bizData);
        setLoading(false);
      } catch (err) { console.error("Loading error:", err); }
    };
    loadData();
  }, []);

  // 🚀 NEW: Function to toggle a business in the Watchlist
  const toggleWatchlist = async (businessId) => {
    try {
      const response = await fetch('http://localhost:3000/api/watchlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investor_id: INVESTOR_ID, business_id: businessId })
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data.isSaved) {
          setSavedBusinessIds([...savedBusinessIds, businessId]);
        } else {
          setSavedBusinessIds(savedBusinessIds.filter(id => id !== businessId));
        }
      }
    } catch (err) { console.error("Watchlist error:", err); }
  };

  // Save Preferences Function
  const savePreferences = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/investors/${INVESTOR_ID}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_budget: profile.min_budget,
          max_budget: profile.max_budget,
          preferred_industry: profile.preferred_industry
        })
      });
      const data = await response.json();
      if (response.ok) alert("✅ " + data.message);
    } catch (err) { console.error("Error saving preferences:", err); }
  };

  // 🚀 UPDATED: The Core Display Algorithm (Now supports Watchlist OR Matches)
  let displayedBusinesses = businesses;
  
  if (showWatchlistOnly) {
    displayedBusinesses = businesses.filter(biz => savedBusinessIds.includes(biz.business_id));
 } else if (showMatchesOnly) {
    displayedBusinesses = businesses.filter(biz => {
      // Force everything to be a real Number for perfect math comparison
      const bizCost = Number(biz.min_investment);
      const prefMin = Number(profile.min_budget);
      const prefMax = Number(profile.max_budget);

      return (
        bizCost >= prefMin &&
        bizCost <= prefMax &&
        (profile.preferred_industry === 'All' || biz.industry_category === profile.preferred_industry)
      );
    });
  }

  // Search Functions
  const handleSearch = async (e) => {
    e.preventDefault(); 
    if (!searchTerm.trim()) return; 
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/search?keyword=${searchTerm}`);
      const data = await response.json();
      if (Array.isArray(data)) setBusinesses(data); 
      setLoading(false);
    } catch (err) { console.error("Search failed", err); }
  };

  const clearSearch = async () => {
    setSearchTerm('');
    setLoading(true);
    const res = await fetch('http://localhost:3000/api/businesses');
    setBusinesses(await res.json());
    setLoading(false);
  };

  // Like and Comment Functions
  const handleLike = async (businessId) => {
    try {
      const res = await fetch('http://localhost:3000/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investor_id: INVESTOR_ID, business_id: businessId }) 
      });
      const data = await res.json();
      if (res.ok) alert('👍 ' + data.message);
      else alert('❌ ' + data.error);
    } catch (err) { console.error(err); }
  };

  const handleComment = async (businessId) => {
    const text = prompt("Enter your comment:");
    if (!text) return; 
    try {
      const res = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, investor_id: INVESTOR_ID, comment_text: text })
      });
      if (res.ok) alert('💬 Comment posted!');
    } catch (err) { console.error(err); }
  };

  const handleViewComments = async (businessId) => {
    if (openComments.id === businessId) {
      setOpenComments({ id: null, data: [] });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/businesses/${businessId}/comments`);
      const data = await response.json();
      setOpenComments({ id: businessId, data: data });
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Personalized Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>👋 Welcome back, {profile.first_name || 'Investor'}!</h2>
        <Link to="/"><button style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button></Link>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* LEFT COLUMN: Controls & Feed */}
        <div style={{ flex: 2 }}>
          
          <div style={{ background: '#f4f4f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Search startups..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', color: '#FFF' }} />
              <button type="submit" style={{ background: '#007bff', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Search</button>
              <button type="button" onClick={clearSearch} style={{ background: '#6c757d', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
            </form>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', background: showMatchesOnly ? '#28a745' : '#e9ecef', color: showMatchesOnly ? 'white' : 'black', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', transition: '0.3s' }}>
                <input 
                  type="checkbox" 
                  checked={showMatchesOnly} 
                  onChange={() => { setShowMatchesOnly(!showMatchesOnly); setShowWatchlistOnly(false); }} 
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                Matches Only
              </label>

              {/* 🚀 NEW: Watchlist Toggle Button */}
              <button 
                onClick={() => { setShowWatchlistOnly(!showWatchlistOnly); setShowMatchesOnly(false); }}
                style={{ background: showWatchlistOnly ? '#ffc107' : '#e9ecef', color: showWatchlistOnly ? 'black' : 'black', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}
              >
                {showWatchlistOnly ? '⭐ Viewing Saved' : '⭐ My Watchlist'}
              </button>
            </div>
          </div>

          <h3>Investment Feed</h3>
          {loading ? <p>Loading data...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {displayedBusinesses.length === 0 ? (
                <div style={{ padding: '20px', background: '#fff3cd', color: '#856404', borderRadius: '5px' }}>No businesses found here.</div>
              ) : (
                displayedBusinesses.map((biz) => {
                  // 🚀 NEW: Check if this business is saved
                  const isSaved = savedBusinessIds.includes(biz.business_id);

                  return (
                    <div key={biz.business_id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: showMatchesOnly ? '#f8fff9' : '#fff', color: '#000' }}>
                      
                      {/* 🚀 NEW: Header wrapper for the Star Button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 5px 0', color: '#0056b3' }}>{biz.business_name}</h3>
                          <span style={{ fontSize: '12px', background: '#eee', padding: '3px 8px', borderRadius: '12px' }}>{biz.industry_category}</span>
                        </div>
                        
                        {/* 🚀 NEW: The Save/Star Button */}
                        <button 
                          onClick={() => toggleWatchlist(biz.business_id)}
                          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: isSaved ? '1' : '0.3' }}
                          title={isSaved ? "Remove from Watchlist" : "Save for Later"}
                        >
                          ⭐
                        </button>
                      </div>

                      <p style={{ margin: '10px 0' }}>{biz.description}</p>
                      <p style={{ margin: '0' }}><strong>Required:</strong> ${biz.min_investment}</p>
                      
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleLike(biz.business_id)} style={{ cursor: 'pointer', padding: '5px 10px' }}>👍 Like</button>
                        <button onClick={() => handleComment(biz.business_id)} style={{ cursor: 'pointer', padding: '5px 10px' }}>💬 Comment</button>
                        {/* 🚀 NEW: Pitch Deck Download Button */}
{biz.pitch_deck_url && (
  <a 
    href={`http://localhost:3000${biz.pitch_deck_url}`} 
    target="_blank" 
    rel="noreferrer"
  >
    <button style={{ background: '#6f42c1', color: 'white', cursor: 'pointer', padding: '5px 10px', border: 'none', borderRadius: '4px' }}>
      📄 View Pitch Deck
    </button>
  </a>
)}
{/* 🚀 NEW: Contact Founder Button */}
{biz.owner_email && (
  <a 
    href={`mailto:${biz.owner_email}?subject=Investor Inquiry: ${biz.business_name} via InvestConnect`}
  >
    <button style={{ background: '#17a2b8', color: 'white', cursor: 'pointer', padding: '5px 10px', border: 'none', borderRadius: '4px' }}>
      📧 Contact Founder
    </button>
  </a>
)}
                        <button 
                          onClick={() => handleViewComments(biz.business_id)} 
                          style={{ cursor: 'pointer', marginLeft: 'auto', padding: '5px 10px' }}
                        >
                          {openComments.id === biz.business_id ? 'Hide Comments' : 'View Comments'}
                        </button>
                      </div>

                      {openComments.id === biz.business_id && (
                        <div style={{ marginTop: '15px', padding: '10px', background: '#2c2c2c', borderRadius: '5px' }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Comments:</h4>
                          {openComments.data.length === 0 ? (
                            <p style={{ margin: 0, fontStyle: 'italic', color: '#aaa' }}>No comments yet. Be the first!</p>
                          ) : (
                            <ul style={{ paddingLeft: '20px', margin: 0, color: '#fff', listStyleType: 'none', padding: 0 }}>
  {openComments.data.map((comment, index) => (
    <li key={index} style={{ marginBottom: '10px', background: '#3a3a3a', padding: '10px', borderRadius: '5px' }}>
      {/* 🚀 NEW: Displays the First and Last Name in bold, followed by the comment */}
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
        👤 {comment.first_name} {comment.last_name}
      </div>
      <div>{comment.comment_text}</div>
    </li>
  ))}
</ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Preferences Panel */}
        <div style={{ flex: 1, background: '#f8f9fa', color: '#000', padding: '20px', borderRadius: '8px', height: 'fit-content', border: '1px solid #dee2e6' }}>
          <h3>⚙️ Match Preferences</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Set your criteria to filter the feed.</p>
          
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <strong>Min Budget ($):</strong>
            <input type="number" value={profile.min_budget} onChange={e => setProfile({...profile, min_budget: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </label>
          
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <strong>Max Budget ($):</strong>
            <input type="number" value={profile.max_budget} onChange={e => setProfile({...profile, max_budget: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </label>

          <label style={{ display: 'block', marginBottom: '20px' }}>
            <strong>Industry:</strong>
            <select 
    value={profile.preferred_industry} 
    onChange={(e) => setProfile({...profile, preferred_industry: e.target.value})}
    style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
>
    <option value="">-- Select Preferred Industry --</option>
    <option value="Technology">Technology</option>
    <option value="Real Estate">Real Estate</option>
    <option value="Medicine & Healthcare">Medicine & Healthcare</option>
    <option value="Retail & E-commerce">Retail & E-commerce</option>
    <option value="Energy & Sustainability">Energy & Sustainability</option>
    <option value="Agriculture & Food">Agriculture & Food</option>
    <option value="Finance & FinTech">Finance & FinTech</option>
    <option value="Entertainment & Media">Entertainment & Media</option>
</select>
          </label>

          <button onClick={savePreferences} style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            💾 Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default InvestorDashboard;