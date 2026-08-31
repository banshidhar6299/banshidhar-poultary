import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Image as ImageIcon, X, CheckCircle, Search } from 'lucide-react';
import { api, formatINR } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Product } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const AdminProductsPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    nameHi: '',
    brand: 'Banshidhar Quality Feeds',
    price: '',
    unit: '50kg Bag',
    unitHi: '50 किग्रा बोरी',
    shortDescription: '',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        nameHi: prod.nameHi || '',
        brand: prod.brand || 'Banshidhar Quality Feeds',
        price: String(prod.price),
        unit: prod.unit || '50kg Bag',
        unitHi: prod.unitHi || '50 किग्रा बोरी',
        shortDescription: prod.shortDescription || '',
        imageUrl: prod.imageUrl || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
        inStock: prod.inStock !== false,
        isActive: prod.isActive !== false
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        nameHi: '',
        brand: 'Banshidhar Quality Feeds',
        price: '',
        unit: '50kg Bag',
        unitHi: '50 किग्रा बोरी',
        shortDescription: '',
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
        inStock: true,
        isActive: true
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price) {
      alert(isHindi ? 'कृपया उत्पाद का नाम और रेट दर्ज करें।' : 'Please enter product name and rate.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', productForm.name.trim());
      formData.append('nameHi', productForm.nameHi.trim() || productForm.name.trim());
      formData.append('brand', productForm.brand.trim());
      formData.append('price', productForm.price);
      formData.append('unit', productForm.unit);
      formData.append('unitHi', productForm.unitHi);
      formData.append('shortDescription', productForm.shortDescription || productForm.name);
      formData.append('inStock', String(productForm.inStock));
      formData.append('isActive', String(productForm.isActive));

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        formData.append('imageUrl', productForm.imageUrl);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isHindi ? 'क्या आप इस उत्पाद को हटाना चाहते हैं?' : 'Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nameHi && p.nameHi.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              {isHindi ? 'उत्पाद सूची (Products)' : 'Product Catalogue'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? 'दाना, चूजा, दवाइयां व अन्य उत्पाद जोड़ें जिनका रेट किसान को सामान देते समय ऑटोमैटिक आएगा'
              : 'Manage feed, chicks, and medicines with automated unit rates for Khata billing'}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isHindi ? '+ नया उत्पाद जोड़ें' : '+ Add New Product'}</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isHindi ? 'उत्पाद का नाम खोजें...' : 'Search products by name...'}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm"
        />
      </div>

      {loading ? (
        <ChickLoader text={isHindi ? 'उत्पाद लोड हो रहे हैं...' : 'Loading products...'} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={isHindi ? 'कोई उत्पाद नहीं मिला' : 'No products found'}
          description={isHindi ? 'नया उत्पाद जोड़ने के लिए ऊपर दिए बटन पर क्लिक करें।' : 'Click "+ Add New Product" to create your first item.'}
          icon={Package}
        />
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod._id}
              className="flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="relative w-full h-36 bg-slate-100 dark:bg-slate-800">
                <img
                  src={prod.imageUrl || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80'}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-[10px] font-black text-brand-700 dark:text-brand-300 shadow-sm">
                  {prod.brand || 'Banshidhar'}
                </span>
                {prod.inStock ? (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-extrabold">
                    {isHindi ? 'उपलब्ध' : 'In Stock'}
                  </span>
                ) : (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[9px] font-extrabold">
                    {isHindi ? 'स्टॉक खत्म' : 'Out of Stock'}
                  </span>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {prod.name}
                  </h3>
                  {prod.nameHi && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{prod.nameHi}</p>
                  )}
                  <div className="mt-2 p-2.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {isHindi ? 'भाव (Rate):' : 'Rate:'}
                    </span>
                    <span className="text-base font-black font-display text-brand-600 dark:text-brand-400">
                      {formatINR(prod.price)}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">/ {prod.unit}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenModal(prod)}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'संपादित करें' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(prod._id)}
                    className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'हटाएं' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingProduct
                    ? isHindi
                      ? 'उत्पाद संपादित करें'
                      : 'Edit Product'
                    : isHindi
                    ? 'नया उत्पाद जोड़ें'
                    : 'Add New Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'उत्पाद का नाम (English) *' : 'Product Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broiler Starter Feed"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'उत्पाद का नाम (हिन्दी)' : 'Product Name (Hindi)'}
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. ब्रॉयलर स्टार्टर दाना"
                    value={productForm.nameHi}
                    onChange={(e) => setProductForm({ ...productForm, nameHi: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'भाव / रेट (₹) *' : 'Price / Rate (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 2250"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black text-sm text-brand-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'इकाई (Unit) *' : 'Unit *'}
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="50kg Bag">50kg Bag (बोरी)</option>
                    <option value="25kg Bag">25kg Bag</option>
                    <option value="1kg Bottle">1kg Bottle (दवाई)</option>
                    <option value="500ml Bottle">500ml Bottle</option>
                    <option value="1 Liter">1 Liter</option>
                    <option value="Chick">Chick (चूजा)</option>
                    <option value="Kg">Kg (किलोग्राम)</option>
                    <option value="Piece">Piece (पीस)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'ब्रांड (Brand)' : 'Brand'}
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'विवरण (Description)' : 'Short Description'}
                </label>
                <input
                  type="text"
                  placeholder="उदा. उच्च गुणवत्ता वाला स्टार्टर फीड"
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'फोटो अपलोड करें (वैकल्पिक)' : 'Product Image (Optional)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting
                    ? isHindi
                      ? 'सहेज रहे हैं...'
                      : 'Saving...'
                    : isHindi
                    ? 'उत्पाद सुरक्षित करें'
                    : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminProductsPage;
