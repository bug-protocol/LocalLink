const mongoose = require('mongoose');
const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');
const Product = require('../models/Product');
const Service = require('../models/Service');

async function seedDevData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Already seeded
    }

    console.log('🌱 Seeding initial demo accounts...');

    // 1. Customer: john@example.com / Test123456
    const customer = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Test123456',
      phone: '9876543210',
      role: 'customer',
      isActive: true,
      isVerified: true,
      address: {
        street: '12 Marine Lines',
        city: 'Mumbai',
        pincode: '400001',
        state: 'Maharashtra',
      },
    });
    await customer.save();

    // 2. Vendor: shop@example.com / Test123456
    const vendorUser = new User({
      name: 'Ramesh Sharma',
      email: 'shop@example.com',
      password: 'Test123456',
      phone: '9800001111',
      role: 'vendor',
      isActive: true,
      isVerified: true,
      address: {
        street: '55 Dadar West',
        city: 'Mumbai',
        pincode: '400001',
        state: 'Maharashtra',
      },
    });
    await vendorUser.save();

    const vendorProfile = new VendorProfile({
      user: vendorUser._id,
      businessName: "Sharma's Fresh Grocery & Essentials",
      businessType: 'shop',
      category: 'grocery',
      description: 'Your trusted neighbourhood grocery store with fresh produce and daily essentials.',
      isVerified: true,
      verificationStatus: 'verified',
      isActive: true,
      rating: 4.8,
      totalReviews: 24,
      totalOrders: 65,
      location: {
        type: 'Point',
        coordinates: [72.8311, 19.0176],
        address: '55 Dadar West, Mumbai',
      },
    });
    await vendorProfile.save();

    // 3. Admin: admin@locallink.com / Admin@1234
    const admin = new User({
      name: 'LocalLink Admin',
      email: 'admin@locallink.com',
      password: 'Admin@1234',
      phone: '9000000000',
      role: 'admin',
      isActive: true,
      isVerified: true,
      address: {
        street: 'Admin Plaza',
        city: 'Mumbai',
        pincode: '400001',
        state: 'Maharashtra',
      },
    });
    await admin.save();

    // Add some sample starter products so the marketplace has content
    const sampleProducts = [
      {
        name: 'Fresh Farm Tomatoes (1kg)',
        description: 'Juicy, farm-fresh red tomatoes directly sourced from local farms.',
        category: 'vegetables',
        price: 40,
        stock: 50,
        unit: 'kg',
        vendor: vendorProfile._id,
        status: 'active',
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop'],
      },
      {
        name: 'Basmati Rice Premium (5kg)',
        description: 'Aromatic long-grain basmati rice aged to perfection.',
        category: 'groceries',
        price: 350,
        stock: 30,
        unit: 'packet',
        vendor: vendorProfile._id,
        status: 'active',
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=300&fit=crop'],
      },
      {
        name: 'Organic Full Cream Milk (1L)',
        description: 'Fresh pasteurized farm milk delivered daily.',
        category: 'dairy',
        price: 65,
        stock: 40,
        unit: 'liter',
        vendor: vendorProfile._id,
        status: 'active',
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop'],
      },
    ];
    await Product.insertMany(sampleProducts);

    console.log('✅ Demo accounts and initial products seeded:');
    console.log('   Customer : john@example.com / Test123456');
    console.log('   Vendor   : shop@example.com / Test123456');
    console.log('   Admin    : admin@locallink.com / Admin@1234');
  } catch (err) {
    console.warn('⚠️  Could not auto-seed demo data:', err.message);
  }
}

module.exports = seedDevData;
