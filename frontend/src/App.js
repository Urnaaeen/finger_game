import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './screens/MainPage';
import Page1 from './screens/LearnPage';
import Page2 from './screens/ThinkPage';
import Page3 from './screens/PathGamePage';
import PausePage from './screens/PausePage';
import Page4 from './screens/SuccessPage';

function App() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/page1" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
          <Route path="/page4" element={<Page4 />} />
          <Route path="/page1/pause" element={<PausePage />} />
        </Routes>
      </Router>
    );
  }


export default App;
