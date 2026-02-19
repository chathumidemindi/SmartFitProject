const express = require('express');
const cors = require('cors');
const clothesRoutes = require('./routes/clothesRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/clothes', clothesRoutes);
app.use('/api', userRoutes);

app.use((req, res) => {
	res.status(404).json({ message: 'Not Found', path: req.originalUrl });
});

app.use((error, req, res, next) => {
	console.error('API error', error);
	res.status(500).json({ message: 'Internal Server Error' });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`API server ready on http://localhost:${port}`);
});
