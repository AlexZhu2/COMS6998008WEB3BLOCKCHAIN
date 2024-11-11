import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MyNavbar from './navbar';
import UploadForm from './upload';

function App() {
  return (
    <Router>
      <MyNavbar />
      <Routes>
        <Route path="/upload" element={<UploadForm />} />
      </Routes>
    </Router>
  );
}

export default App;
