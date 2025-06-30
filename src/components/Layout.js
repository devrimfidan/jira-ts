import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children, user, selectedUser, onCreateRequest, onRefresh, onUserSwitch }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header 
          user={user} 
          selectedUser={selectedUser}
          onCreateRequest={onCreateRequest} 
          onRefresh={onRefresh} 
          onUserSwitch={onUserSwitch}
        />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
