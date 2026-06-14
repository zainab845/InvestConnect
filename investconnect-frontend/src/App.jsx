import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import Register from './Register'; 
import OwnerDashboard from './OwnerDashboard';
import InvestorDashboard from './InvestorDashboard'; // We keep the import!
import AdminDashboard from './AdminDashboard';
import './App.css';

// Optional Landing Page (if you are using it instead of Login as the main page)
const LandingPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Welcome to InvestConnect</h1>
    <p>Connecting Business Owners with Potential Investors.</p>
    <div style={{ marginTop: '20px', gap: '10px', display: 'flex', justifyContent: 'center' }}>
      <Link to="/investor"><button>Login as Investor</button></Link>
      <Link to="/owner"><button>Login as Owner</button></Link>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/investor-dashboard" element={<InvestorDashboard />} /> 
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;