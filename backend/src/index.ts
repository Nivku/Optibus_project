import express from 'express';
import cors from 'cors';
import vehicleRoutes from './routes/vehicleRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


app.get('/api/health', (req, res) => {
    res.status(200).send('Vehicle Management API is up and running!');
});


app.use('/api/vehicles', vehicleRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});