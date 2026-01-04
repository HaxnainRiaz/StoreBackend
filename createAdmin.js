const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const adminExists = await User.findOne({ email: 'admin@luminelle.com' });
        if (adminExists) {
            console.log('Admin already exists!');
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
