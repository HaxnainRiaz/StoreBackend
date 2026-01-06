const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Coupon = require('./models/Coupon');
const auditLogger = require('./utils/auditLogger');

dotenv.config();

/**
 * ⚠️ DANGER ZONE - DATABASE RESET UTILITY
 * 
 * This script will DELETE ALL DATA from your database.
 * Use with EXTREME caution!
 * 
 * Usage: node resetDatabase.js
 */

const resetDatabase = async () => {
    try {
        console.log('\n========================================');
        console.log('⚠️  CRITICAL WARNING - DATABASE RESET');
        console.log('========================================');
        console.log('This will DELETE ALL data from:');
        console.log('  - Products');
        console.log('  - Categories');
        console.log('  - Orders');
        console.log('  - Reviews');
        console.log('  - Coupons');
        console.log('  - (Users are preserved)');
        console.log('========================================\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Count existing data
        const counts = {
            products: await Product.countDocuments(),
            categories: await Category.countDocuments(),
            orders: await Order.countDocuments(),
            reviews: await Review.countDocuments(),
            coupons: await Coupon.countDocuments()
        };

        console.log('📊 Current Database Status:');
        console.log(`   Products: ${counts.products}`);
        console.log(`   Categories: ${counts.categories}`);
        console.log(`   Orders: ${counts.orders}`);
        console.log(`   Reviews: ${counts.reviews}`);
        console.log(`   Coupons: ${counts.coupons}`);
        console.log('');

        // Perform deletion
        console.log('🗑️  Deleting all data...');
        await Product.deleteMany();
        await Category.deleteMany();
        await Order.deleteMany();
        await Review.deleteMany();
        await Coupon.deleteMany();

        // Log to audit trail
        auditLogger.logReset(counts);

        console.log('✅ Database reset complete!');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Run: node seeder.js (to add sample data)');
        console.log('  2. Run: node seedCategories.js (to add categories)');
        console.log('  3. Run: node createAdmin.js (if admin was deleted)');
        console.log('');

        process.exit(0);
    } catch (err) {
        auditLogger.logError('DATABASE_RESET', err);
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
};

// Execute
resetDatabase();
