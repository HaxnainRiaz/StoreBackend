const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const products = [
    {
        title: "Radiant Glow Face Oil",
        slug: "radiant-glow-face-oil",
        price: 85,
        description: "Restore your skin's natural radiance with our luxury facial oil.",
        category: "Face",
        images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800"],
        stock: 45,
        rating: 4.8,
        reviews: 124,
        ingredients: ["Jojoba Oil", "Rosehip", "Vitamin E"],
        concerns: ["Dryness", "Dullness"]
    },
    {
        title: "Silk Peptide Cream",
        slug: "silk-peptide-cream",
        price: 92,
        salePrice: 85,
        description: "Smooth and firm your skin with our peptide-rich cream.",
        category: "Face",
        images: ["https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800"],
        stock: 12,
        rating: 4.9,
        reviews: 89,
        ingredients: ["Peptides", "Hyaluronic Acid"],
        concerns: ["Aging", "Fine Lines"]
    },
    {
        title: "Luminous Eye Serum",
        slug: "luminous-eye-serum",
        price: 64,
        description: "Brighten your eyes instantly with our caffeine-infused serum.",
        category: "Eyes",
        images: ["https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=800"],
        stock: 5,
        rating: 4.7,
        reviews: 56,
        ingredients: ["Caffeine", "Green Tea"],
        concerns: ["Dark Circles", "Puffiness"]
    }
];

const seedDB = async () => {
    try {
        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log("Database Seeded!");
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

seedDB();
