import React from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateContest from './pages/CreateContest';
import BoardView from './components/BoardView';
import LandingPage from './components/LandingPage';
import FullScreenLoading from './components/loading/FullScreenLoading';

// Wrapper to handle root routing logic
const Home = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const poolId = searchParams.get('poolId');

  // If poolId is present, show the board
  if (poolId) {
    return <BoardView />;
  }

  // Otherwise show the landing page
  return (
    <LandingPage
      onCreate={() => navigate('/create')}
      onLogin={() => navigate('/login')}
      onJoin={() => navigate('/login')} // For now, redirect join to login
    />
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <React.Suspense fallback={<FullScreenLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateContest />} />
            <Route path="*" element={<BoardView />} />
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;
