const Product = require('../models/Product');
const mongoose = require('mongoose');
const Category = require('../models/Category');
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
        // Transform Frontend Payload to Backend Schema
        console.log('Original req.body:', JSON.stringify(req.body));

        // Map isBestseller (various casings)
        if (req.body.isBestseller !== undefined) req.body.isBestSeller = req.body.isBestseller;
        if (req.body.isBestSeller === undefined && req.body.isBestseller !== undefined) {
            req.body.isBestSeller = req.body.isBestseller;
        }

        if (req.body.seo) {
            req.body.metaTitle = req.body.seo.metaTitle || '';
            req.body.metaDescription = req.body.seo.metaDescription || '';
        }

        if (req.body.howToUse !== undefined) req.body.usage = req.body.howToUse;

        if (req.body.visibilityStatus) {
            req.body.status = req.body.visibilityStatus === 'published' ? 'active' : 'inactive';
        }

        // Map Category String or Object to ID
        if (req.body.category) {
            if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
                // If it's a string name, find the category
                const categoryDoc = await Category.findOne({
                    title: { $regex: new RegExp(`^${req.body.category}$`, 'i') }
                });
                if (categoryDoc) {
                    req.body.category = categoryDoc._id;
                } else {
                    console.warn(`Category not found: ${req.body.category}`);
                    delete req.body.category;
                }
            }
        }

        console.log('Transformed req.body:', JSON.stringify(req.body));

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
        // Transform Frontend Payload to Backend Schema
        console.log('Update payload original:', JSON.stringify(req.body));

        if (req.body.isBestseller !== undefined) req.body.isBestSeller = req.body.isBestseller;
        if (req.body.seo) {
            req.body.metaTitle = req.body.seo.metaTitle || '';
            req.body.metaDescription = req.body.seo.metaDescription || '';
        }
        if (req.body.howToUse !== undefined) req.body.usage = req.body.howToUse;
        if (req.body.visibilityStatus) {
            req.body.status = req.body.visibilityStatus === 'published' ? 'active' : 'inactive';
        }

        // Map Category String or Object to ID
        if (req.body.category) {
            if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
                const categoryDoc = await Category.findOne({
                    title: { $regex: new RegExp(`^${req.body.category}$`, 'i') }
                });
                if (categoryDoc) {
                    req.body.category = categoryDoc._id;
                } else {
                    console.warn(`Update: Category not found: ${req.body.category}`);
                    delete req.body.category;
                }
            }
        }
        console.log('Update payload transformed:', JSON.stringify(req.body));

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
