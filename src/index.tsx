import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Account from './Account';
import NewPass from './NewPass';
import { CurrentUser } from './data';
import Page404 from './Page404';
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/404' element={<Page404 />} />
        <Route path="/" element={<App />} />
        <Route path="/account" element={<Account name={CurrentUser.username || ''} pass={CurrentUser.pass || ''} />} />
        <Route path="/newpass" element={<NewPass name={CurrentUser.username || ''} />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
