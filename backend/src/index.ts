import express from 'express';
import cors from 'cors';
import vehicleRoutes from './routes/vehicleRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// הגדרת Middleware
app.use(cors()); // מאפשר גישה ל-API ממקורות שונים (כמו אפליקציית ה-React שלך)
app.use(express.json()); // מאפשר לשרת לקרוא JSON מגוף הבקשה

// הגדרת נתיב בסיס לבדיקת תקינות
app.get('/api/health', (req, res) => {
    res.status(200).send('Vehicle Management API is up and running!');
});

// חיבור נתיבי הרכבים תחת /api/vehicles
app.use('/api/vehicles', vehicleRoutes);

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});