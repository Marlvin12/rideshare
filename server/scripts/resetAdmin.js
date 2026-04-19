import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash('admin123', 12);
  const result = await mongoose.connection.db
    .collection('admins')
    .updateOne({ email: 'admin@ride.com' }, { $set: { password: hash } });

  if (result.matchedCount === 0) {
    await mongoose.connection.db.collection('admins').insertOne({
      email: 'admin@ride.com',
      password: hash,
      name: 'Admin',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Admin created with hashed password');
  } else {
    console.log('Admin password reset');
  }

  const admin = await mongoose.connection.db
    .collection('admins')
    .findOne({ email: 'admin@ride.com' });
  const match = await bcrypt.compare('admin123', admin.password);
  console.log('Verify:', match);

  await mongoose.disconnect();
};

run();
