const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

const envPath = process.argv.includes('--prod') ? '.env.production' : '.env';
dotenv.config({ path: envPath });

console.log(`Using environment: ${envPath}`);

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        let admin = await User.findOne({ email: 'admin@luminelle.com' });

        if (admin) {
            console.log('Admin already exists. Updating password...');
            admin.password = 'admin123';
            admin.role = 'admin';
            await admin.save();
            console.log('Admin password updated successfully!');
            process.exit();
        }

        const admin = await User.create({
            name: 'Hasnain Admin',
            email: 'admin@luminelle.com',
            password: 'admin123', // This will be automatically hashed by our User model pre-save hook
            role: 'admin'
        });

        console.log('Admin User Created Successfully!');
        console.log('Email: admin@luminelle.com');
        console.log('Password: admin123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
