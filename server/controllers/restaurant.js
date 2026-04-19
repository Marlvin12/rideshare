import logger from '../config/logger.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import {
  mockRestaurants,
  mockMenuItems,
  getRestaurantById as getMockRestaurantById,
  getMenuByRestaurantId as getMockMenuByRestaurantId,
  searchRestaurants as searchMockRestaurants,
  filterRestaurants as filterMockRestaurants,
} from '../utils/mockEatsData.js';

const USE_MOCK_DATA =
  process.env.NODE_ENV === 'production'
    ? false
    : process.env.USE_MOCK_DATA === '1' || process.env.USE_MOCK_DATA === 'true';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getRestaurants = async (req, res) => {
  try {
    const { cuisine, isOpen, featured, minRating, priceRange, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    if (USE_MOCK_DATA) {
      let results;
      if (search) {
        results = searchMockRestaurants(search);
      } else {
        results = filterMockRestaurants({
          cuisine,
          isOpen: isOpen === 'true' ? true : isOpen === 'false' ? false : undefined,
          featured: featured === 'true',
          minRating: minRating ? parseFloat(minRating) : undefined,
          priceRange,
        });
      }

      const paginated = results.slice(skip, skip + limit);
      return res.status(200).json({
        success: true,
        count: paginated.length,
        total: results.length,
        page,
        totalPages: Math.ceil(results.length / limit),
        restaurants: paginated,
      });
    }

    const query = { status: 'active' };
    if (cuisine && cuisine !== 'All') {
      query.cuisine = { $in: [cuisine] };
    }
    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true';
    }
    if (featured === 'true') {
      query.featured = true;
    }
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    if (priceRange) {
      query.priceRange = priceRange;
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .sort({ featured: -1, rating: -1 })
        .skip(skip)
        .limit(limit),
      Restaurant.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      restaurants,
    });
  } catch (error) {
    logger.error({ err: error }, 'getRestaurants failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch restaurants' });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    if (USE_MOCK_DATA) {
      const restaurant = getMockRestaurantById(id);
      if (!restaurant) {
        return res.status(404).json({ success: false, msg: 'Restaurant not found' });
      }
      return res.status(200).json({ success: true, restaurant });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, msg: 'Restaurant not found' });
    }

    res.status(200).json({ success: true, restaurant });
  } catch (error) {
    logger.error({ err: error }, 'getRestaurantById failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch restaurant' });
  }
};

export const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    if (USE_MOCK_DATA) {
      let menuItems = getMockMenuByRestaurantId(id);
      if (category) {
        menuItems = menuItems.filter(
          (item) => item.category.toLowerCase() === category.toLowerCase()
        );
      }
      const categories = [...new Set(getMockMenuByRestaurantId(id).map((item) => item.category))];
      return res.status(200).json({
        success: true,
        count: menuItems.length,
        categories,
        menuItems,
      });
    }

    const query = { restaurantId: id, isAvailable: true };
    if (category) {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    const categories = await MenuItem.distinct('category', { restaurantId: id });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      categories,
      menuItems,
    });
  } catch (error) {
    logger.error({ err: error }, 'getRestaurantMenu failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch menu' });
  }
};

export const searchRestaurants = async (req, res) => {
  try {
    const { q } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    if (!q) {
      return res.status(400).json({ success: false, msg: 'Search query is required' });
    }

    if (USE_MOCK_DATA) {
      const allResults = searchMockRestaurants(q);
      const paginated = allResults.slice(skip, skip + limit);
      return res.status(200).json({
        success: true,
        count: paginated.length,
        total: allResults.length,
        page,
        totalPages: Math.ceil(allResults.length / limit),
        restaurants: paginated,
      });
    }

    const searchQuery = { $text: { $search: q }, status: 'active' };
    const [restaurants, total] = await Promise.all([
      Restaurant.find(searchQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit),
      Restaurant.countDocuments(searchQuery),
    ]);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      restaurants,
    });
  } catch (error) {
    logger.error({ err: error }, 'searchRestaurants failed');
    res.status(500).json({ success: false, msg: 'Search failed' });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const restaurantData = req.body;
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    res.status(201).json({ success: true, msg: 'Restaurant created successfully', restaurant });
  } catch (error) {
    logger.error({ err: error }, 'createRestaurant failed');
    res.status(500).json({ success: false, msg: 'Failed to create restaurant' });
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, msg: 'Restaurant not found' });
    }

    res.status(200).json({ success: true, msg: 'Restaurant updated successfully', restaurant });
  } catch (error) {
    logger.error({ err: error }, 'updateRestaurant failed');
    res.status(500).json({ success: false, msg: 'Failed to update restaurant' });
  }
};

export const toggleRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (USE_MOCK_DATA) {
      const restaurant = getMockRestaurantById(id);
      if (restaurant) {
        restaurant.isOpen = !restaurant.isOpen;
        return res.status(200).json({
          success: true,
          msg: `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`,
          isOpen: restaurant.isOpen,
        });
      }
      return res.status(404).json({ success: false, msg: 'Restaurant not found' });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, msg: 'Restaurant not found' });
    }

    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();

    res.status(200).json({
      success: true,
      msg: `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`,
      isOpen: restaurant.isOpen,
    });
  } catch (error) {
    logger.error({ err: error }, 'toggleRestaurantStatus failed');
    res.status(500).json({ success: false, msg: 'Failed to toggle restaurant status' });
  }
};

export const partnerSetRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ success: false, msg: 'isOpen must be a boolean' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: { isOpen } },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, msg: 'Restaurant not found' });
    }

    res.status(200).json({
      success: true,
      msg: restaurant.isOpen ? 'Restaurant is now open' : 'Restaurant is now closed',
      isOpen: restaurant.isOpen,
    });
  } catch (error) {
    logger.error({ err: error }, 'partnerSetRestaurantStatus failed');
    res.status(500).json({ success: false, msg: 'Failed to update status' });
  }
};

export const partnerSetRestaurantPreparationTime = async (req, res) => {
  try {
    const { id } = req.params;
    const preparationTime = req.body.preparationTime != null ? Number(req.body.preparationTime) : null;

    if (preparationTime == null || preparationTime < 5 || preparationTime > 120) {
      return res.status(400).json({
        success: false,
        msg: 'preparationTime must be between 5 and 120 minutes',
      });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: { preparationTime } },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, msg: 'Restaurant not found' });
    }

    res.status(200).json({
      success: true,
      msg: 'Preparation time updated',
      preparationTime: restaurant.preparationTime,
    });
  } catch (error) {
    logger.error({ err: error }, 'partnerSetRestaurantPreparationTime failed');
    res.status(500).json({ success: false, msg: 'Failed to update preparation time' });
  }
};

export const addMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItemData = { ...req.body, restaurantId: id };

    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();

    res.status(201).json({ success: true, msg: 'Menu item added successfully', menuItem });
  } catch (error) {
    logger.error({ err: error }, 'addMenuItem failed');
    res.status(500).json({ success: false, msg: 'Failed to add menu item' });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const updates = req.body;

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: itemId, restaurantId: id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ success: false, msg: 'Menu item not found' });
    }

    res.status(200).json({ success: true, msg: 'Menu item updated successfully', menuItem });
  } catch (error) {
    logger.error({ err: error }, 'updateMenuItem failed');
    res.status(500).json({ success: false, msg: 'Failed to update menu item' });
  }
};

export const updateMenuItemAvailability = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ success: false, msg: 'isAvailable must be a boolean' });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: itemId, restaurantId: id },
      { $set: { isAvailable } },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ success: false, msg: 'Menu item not found' });
    }

    res.status(200).json({ success: true, msg: 'Availability updated', menuItem });
  } catch (error) {
    logger.error({ err: error }, 'updateMenuItemAvailability failed');
    res.status(500).json({ success: false, msg: 'Failed to update availability' });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const menuItem = await MenuItem.findOneAndDelete({
      _id: itemId,
      restaurantId: id,
    });

    if (!menuItem) {
      return res.status(404).json({ success: false, msg: 'Menu item not found' });
    }

    res.status(200).json({ success: true, msg: 'Menu item deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'deleteMenuItem failed');
    res.status(500).json({ success: false, msg: 'Failed to delete menu item' });
  }
};

export const getCategories = async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      const categories = [...new Set(mockMenuItems.map((item) => item.category))];
      return res.status(200).json({ success: true, categories });
    }

    const categories = await MenuItem.distinct('category');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    logger.error({ err: error }, 'getCategories failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch categories' });
  }
};

export const getCuisines = async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      const cuisines = [...new Set(mockRestaurants.flatMap((r) => r.cuisine))];
      return res.status(200).json({ success: true, cuisines: ['All', ...cuisines] });
    }

    const cuisines = await Restaurant.distinct('cuisine');
    res.status(200).json({ success: true, cuisines: ['All', ...cuisines] });
  } catch (error) {
    logger.error({ err: error }, 'getCuisines failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch cuisines' });
  }
};
