const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const categories = [
    { name: "Face", slug: "face", description: "Advanced care for your complexion" },
    { name: "Eyes", slug: "eyes", description: "Targeted treatments for the delicate eye area" },
    { name: "Body", slug: "body", description: "Luxurious moisture for your entire silhouette" },
    { name: "Serums", slug: "serums", description: "High-potency elixirs for specific concerns" }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB...');

        await Category.deleteMany({});
        const created = await Category.insertMany(categories);

        console.log(`${created.length} Categories seeded!`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCategories();
