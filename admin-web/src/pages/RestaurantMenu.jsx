import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import api from '../services/api';
import RestaurantSelector, { getStoredRestaurantId } from '../components/RestaurantSelector';

const defaultItem = {
  name: '',
  description: '',
  price: '',
  category: '',
  newCategory: '',
  isAvailable: true,
  isVegetarian: false,
  preparationTime: 15,
};

export default function RestaurantMenu() {
  const [restaurantId, setRestaurantId] = useState(getStoredRestaurantId());
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [formData, setFormData] = useState(defaultItem);
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      const res = await api.get(`/restaurants/${restaurantId}/menu`);
      if (res.data.success) {
        setMenuItems(res.data.menuItems || []);
        setCategories(res.data.categories || []);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setMenuItems([]);
      setCategories([]);
      setLoading(false);
      return;
    }
    fetchMenu();
  }, [fetchMenu, restaurantId]);

  const handleOpenDialog = (item = null) => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        price: String(item.price ?? ''),
        category: item.category || '',
        isAvailable: item.isAvailable ?? true,
        isVegetarian: item.isVegetarian ?? false,
        preparationTime: item.preparationTime ?? 15,
      });
      setEditDialog({ open: true, item });
    } else {
      setFormData(defaultItem);
      setEditDialog({ open: true, item: null });
    }
  };

  const handleCloseDialog = () => {
    setEditDialog({ open: false, item: null });
    setFormData(defaultItem);
  };

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.price || !formData.category?.trim()) return;
    const category = formData.category === '__new__' ? formData.newCategory?.trim() : formData.category;
    if (!category) return;

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        price: parseFloat(formData.price) || 0,
        category,
        isAvailable: formData.isAvailable,
        isVegetarian: formData.isVegetarian,
        preparationTime: Number(formData.preparationTime) || 15,
      };
      if (editDialog.item) {
        await api.patch(`/restaurants/${restaurantId}/menu/item/${editDialog.item._id}`, data);
      } else {
        await api.post(`/restaurants/${restaurantId}/menu/item`, data);
      }
      fetchMenu();
      handleCloseDialog();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await api.patch(`/restaurants/${restaurantId}/menu/item/${itemId}`, {
        isAvailable: !currentStatus,
      });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/restaurants/${restaurantId}/menu/item/${itemId}`);
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  if (!restaurantId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Menu Management</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">Select a restaurant to manage the menu</p>
          <div className="mt-6 flex justify-center">
            <RestaurantSelector value="" onChange={setRestaurantId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Menu Management</h1>
        <div className="flex items-center gap-3">
          <RestaurantSelector value={restaurantId} onChange={setRestaurantId} />
          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            selectedCategory === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <UtensilsCrossed className="mx-auto text-slate-300" size={48} />
          <p className="mt-4 text-slate-600">No menu items</p>
          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 mx-auto"
          >
            <Plus size={18} />
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
                !item.isAvailable ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">{item.name}</h3>
                    {item.isVegetarian && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                        V
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                </div>
                <p className="text-lg font-bold text-blue-600 shrink-0">
                  ${Number(item.price).toFixed(2)}
                </p>
              </div>
              {item.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.isAvailable}
                    onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      item.isAvailable ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        item.isAvailable ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDialog(item)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                    aria-label="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editDialog.item ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prep (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.preparationTime}
                    onChange={(e) =>
                      setFormData({ ...formData, preparationTime: Number(e.target.value) || 15 })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="">Select</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__new__">+ New category</option>
                </select>
                {formData.category === '__new__' && (
                  <input
                    type="text"
                    value={formData.newCategory || ''}
                    onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
                    placeholder="Category name"
                    className="mt-2 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                  />
                )}
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Vegetarian</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  !formData.name?.trim() ||
                  !formData.price ||
                  !formData.category?.trim() ||
                  (formData.category === '__new__' && !formData.newCategory?.trim())
                }
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
