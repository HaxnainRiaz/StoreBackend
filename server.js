const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Import Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cmsRoutes = require('./routes/cms');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const couponRoutes = require('./routes/coupons');
const reviewRoutes = require('./routes/reviews');
const statsRoutes = require('./routes/stats');
const ticketRoutes = require('./routes/tickets');
const auditRoutes = require('./routes/audit');
const bannerRoutes = require('./routes/banners');
const settingsRoutes = require('./routes/settings');
const newsletterRoutes = require('./routes/newsletter');
const seoRoutes = require('./routes/seo');
const supportTicketRoutes = require('./routes/support-tickets');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/support-tickets', supportTicketRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
