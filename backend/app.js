const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables before requiring configuration modules
dotenv.config();

const connectDB = require('./config/db');

const clothesRoutes = require('./routes/clothesRoutes');
const userRoutes = require('./routes/userRoutes');
const bodyRoutes = require('./routes/bodyRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Connect to MongoDB Atlas
connectDB();

const app = express();

app.use(cors({
	origin: process.env.CLIENT_URL || 'http://localhost:3000',
	credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/clothes', clothesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/body', bodyRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);

// Legacy route alias for backward compatibility
app.use('/api', userRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
	console.error('API Error Stack:', err.stack || err.message);
	const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
	res.status(statusCode).json({
		success: false,
		message: err.message || 'Internal Server Error'
	});
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`SmartFit API Server ready on http://localhost:${port}`);
});