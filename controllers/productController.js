const Product = require('../models/Product');
const mongoose = require('mongoose');
const { createLog } = require('./auditController');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create product (Admin Only)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
    try {
        // Sanitize category ID: If it's a string name (like "Eyes") instead of a valid ObjectId,
        // we strip it to prevent Mongoose CastError since it's an optional field anyway.
        if (req.body.category && !mongoose.Types.ObjectId.isValid(req.body.category)) {
            console.warn(`Stripping invalid category ID: ${req.body.category}`);
            delete req.body.category;
        }

        const product = await Product.create(req.body);

        // Audit Log
        await createLog(req.user.id, 'Product Creation', `Created product: ${product.title} (${product.slug})`);

        res.status(201).json({ success: true, data: product });
    } catch (err) {
        console.error('Create Product Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update product (Admin Only)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
    try {
        // Sanitize category ID for updates
        if (req.body.category && !mongoose.Types.ObjectId.isValid(req.body.category)) {
            delete req.body.category;
        }

        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Audit Log
        await createLog(req.user.id, 'Product Update', `Updated product: ${product.title}`);

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        console.error('Update Product Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete product (Admin Only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productTitle = product.title;
        await product.deleteOne();

        // Audit Log
        await createLog(req.user.id, 'Product Deletion', `Deleted product: ${productTitle}`);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
