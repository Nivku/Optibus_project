import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // מייבא את האפליקציה שלך
import './index.css';     // מייבא את העיצוב

// זה כל מה שהקובץ הזה עושה:
// הוא מוצא את האלמנט עם id="root" ב-HTML
// ומרנדר (מציג) את רכיב ה-App שלך בתוכו
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

