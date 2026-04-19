import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const TEST_RESTAURANT_IDS = [
  '641000000000000000000001',
  '641000000000000000000002',
  '641000000000000000000003',
];

const DUMMY_RESTAURANTS = [
  {
    _id: new mongoose.Types.ObjectId(TEST_RESTAURANT_IDS[0]),
    name: 'Test Kitchen Alpha',
    description: 'Dummy restaurant for testing the partner flow. Burgers, fries, and shakes.',
    cuisine: ['Fast Food', 'Burgers'],
    rating: 4.2,
    reviewCount: 0,
    priceRange: '$$',
    deliveryFee: 2,
    minimumOrder: 5,
    location: {
      address: '123 Test Street, Harare',
      latitude: -17.8292,
      longitude: 31.0522,
    },
    contactPhone: '+263771000001',
    isOpen: true,
    preparationTime: 20,
  },
  {
    _id: new mongoose.Types.ObjectId(TEST_RESTAURANT_IDS[1]),
    name: 'Test Kitchen Beta',
    description: 'Dummy restaurant for testing. Pizzas and pasta.',
    cuisine: ['Pizza', 'Italian'],
    rating: 4.0,
    reviewCount: 0,
    priceRange: '$$',
    deliveryFee: 2.5,
    minimumOrder: 10,
    location: {
      address: '456 Demo Avenue, Harare',
      latitude: -17.7892,
      longitude: 31.0345,
    },
    contactPhone: '+263771000002',
    isOpen: true,
    preparationTime: 25,
  },
  {
    _id: new mongoose.Types.ObjectId(TEST_RESTAURANT_IDS[2]),
    name: 'Test Kitchen Gamma',
    description: 'Dummy restaurant for testing. Rice bowls and salads.',
    cuisine: ['Healthy', 'Asian'],
    rating: 4.5,
    reviewCount: 0,
    priceRange: '$',
    deliveryFee: 1.5,
    minimumOrder: 8,
    location: {
      address: '789 Sample Road, Harare',
      latitude: -17.7634,
      longitude: 31.0756,
    },
    contactPhone: '+263771000003',
    isOpen: true,
    preparationTime: 15,
  },
];

const DUMMY_MENU_ITEMS = [
  { restaurantId: TEST_RESTAURANT_IDS[0], name: 'Classic Burger', price: 6, category: 'Burgers', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[0], name: 'Cheese Burger', price: 7, category: 'Burgers', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[0], name: 'Fries', price: 2, category: 'Sides', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[0], name: 'Milkshake', price: 3, category: 'Drinks', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[1], name: 'Margherita Pizza', price: 12, category: 'Pizza', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[1], name: 'Pepperoni Pizza', price: 14, category: 'Pizza', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[1], name: 'Pasta Bolognese', price: 10, category: 'Pasta', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[2], name: 'Chicken Rice Bowl', price: 9, category: 'Bowls', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[2], name: 'Caesar Salad', price: 7, category: 'Salads', isAvailable: true },
  { restaurantId: TEST_RESTAURANT_IDS[2], name: 'Green Smoothie', price: 4, category: 'Drinks', isAvailable: true },
];

const parseSeedLimit = () => {
  const rawLimit = process.env.SEED_RESTAURANT_LIMIT;
  if (!rawLimit) {
    return DUMMY_RESTAURANTS.length;
  }
  const parsed = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, DUMMY_RESTAURANTS.length);
};

async function seedRestaurants() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    const seedLimit = parseSeedLimit();
    const selectedRestaurants = DUMMY_RESTAURANTS.slice(0, seedLimit);
    const selectedIds = TEST_RESTAURANT_IDS.slice(0, seedLimit).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const selectedMenuItems = DUMMY_MENU_ITEMS.filter((item) =>
      TEST_RESTAURANT_IDS.slice(0, seedLimit).includes(item.restaurantId)
    );

    const result = await Restaurant.deleteMany({
      _id: { $in: TEST_RESTAURANT_IDS.map((id) => new mongoose.Types.ObjectId(id)) },
    });
    console.log(`Cleared ${result.deletedCount} existing test restaurants`);

    await MenuItem.deleteMany({
      restaurantId: { $in: TEST_RESTAURANT_IDS.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    await Restaurant.insertMany(selectedRestaurants);
    console.log(`Created ${selectedRestaurants.length} restaurants`);

    const menuDocs = selectedMenuItems.map((item) => ({
      restaurantId: new mongoose.Types.ObjectId(item.restaurantId),
      name: item.name,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
    }));
    await MenuItem.insertMany(menuDocs);
    console.log(`Created ${menuDocs.length} menu items`);

    console.log('\n=== Test Restaurants Ready ===');
    console.log('Set EXPO_PUBLIC_RESTAURANT_ID in client/.env to one of:\n');
    selectedIds.forEach((id, i) => {
      console.log(`  ${i + 1}. ${String(id)}  (${selectedRestaurants[i].name})`);
    });
    console.log(`\nExample: EXPO_PUBLIC_RESTAURANT_ID=${String(selectedIds[0])}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding restaurants:', error);
    process.exit(1);
  }
}

seedRestaurants();
