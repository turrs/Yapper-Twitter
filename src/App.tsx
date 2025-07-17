import React from 'react';
import TwitterAutoCommentTool from './components/TwitterAutoCommentTool';
import TwitterOauthCallback from './components/TwitterOauthCallback';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TwitterAutoCommentTool />} />
        <Route path="/oauth/twitter" element={<TwitterOauthCallback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;