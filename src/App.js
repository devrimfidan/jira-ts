import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CreateIssueForm from './components/CreateIssueForm';
import IssueDetails from './components/IssueDetails';
import { fetchMyTickets, fetchCurrentUser, fetchUserTickets } from './api/jira';

function App() {
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState({ 
    name: 'Targeted Services', 
    email: 'contact@targeted.services' 
  });

  useEffect(() => {
    loadData();
  }, [selectedUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user data and tickets for selected user
      const [userData, ticketsData] = await Promise.all([
        fetchCurrentUser(),
        fetchUserTickets(selectedUser.email)
      ]);
      
      setUser(userData);
      setAllTickets(ticketsData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleCreateRequest = () => {
    setShowCreateForm(true);
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleUserSwitch = (userEmail) => {
    const users = [
      { name: 'Targeted Services', email: 'contact@targeted.services' },
      { name: 'Emin Fidan', email: 'efidan@ku.edu.tr' }
    ];
    
    const newUser = users.find(u => u.email === userEmail) || users[0];
    setSelectedUser(newUser);
    setSelectedTicket(null); // Clear selected ticket when switching users
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your Jira tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-message">{error}</p>
          <button onClick={handleRefresh} className="error-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return <CreateIssueForm onClose={() => setShowCreateForm(false)} onSuccess={loadData} user={user} selectedUser={selectedUser} />;
  }

  return (
    <>
      <Layout 
        user={user} 
        selectedUser={selectedUser}
        onCreateRequest={handleCreateRequest} 
        onRefresh={handleRefresh}
        onUserSwitch={handleUserSwitch}
      >
        <Dashboard 
          allTickets={allTickets}
          user={user}
          onTicketClick={handleTicketClick}
          selectedTicket={selectedTicket}
          onCreateRequest={handleCreateRequest}
          onRefresh={handleRefresh}
        />
      </Layout>
      
      {selectedTicket && (
        <IssueDetails 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)}
          user={user}
        />
      )}
    </>
  );
}

export default App;
