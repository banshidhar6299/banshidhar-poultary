import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { api, formatINR } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Product, Category } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const AdminProductsPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    nameHi: '',
    category: '',
    brand: 'Banshidhar Quality Feeds',
    price: '',
    unit: '50kg Bag',
    unitHi: '50 किग्रा बोरी',
    shortDescription: '',
    shortDescriptionHi: '',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    isFeatured: false,
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) {
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0 && !productForm.category) {
          setProductForm((prev) => ({ ...prev, category: catRes.data.data[0]._id }));
        }
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
        nameHi: prod.nameHi,
        category: typeof prod.category === 'object' ? prod.category._id : prod.category,
        brand: prod.brand,
        price: String(prod.price),
        unit: prod.unit,
        unitHi: prod.unitHi || '',
        shortDescription: prod.shortDescription,
        shortDescriptionHi: prod.shortDescriptionHi || '',
        imageUrl: prod.imageUrl,
        isFeatured: prod.isFeatured,
        isActive: prod.isActive
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        nameHi: '',
        category: categories[0]?._id || '',
        brand: 'Banshidhar Quality Feeds',
        price: '',
        unit: '50kg Bag',
        unitHi: '50 किग्रा बोरी',
        shortDescription: '',
        shortDescriptionHi: '',
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
        isFeatured: false,
        isActive: true
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('nameHi', productForm.nameHi);
      formData.append('category', productForm.category);
      formData.append('brand', productForm.brand);
      formData.append('price', productForm.price);
      formData.append('unit', productForm.unit);
      formData.append('unitHi', productForm.unitHi);
      formData.append('shortDescription', productForm.shortDescription);
      formData.append('shortDescriptionHi', productForm.shortDescriptionHi);
      formData.append('isFeatured', String(productForm.isFeatured));
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
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  if (loading) return <ChickLoader text="Loading products..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'उत्पाद सूची प्रबंधन' : 'Product Catalogue Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage feed products, chick pricing, and catalogue items
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((prod) => (
          <div
            key={prod._id}
            className="flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800">
              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-[10px] font-bold text-brand-700">
                {prod.brand}
              </span>
            </div>

            <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {prod.name}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1">{prod.nameHi}</p>
                <p className="text-sm font-black font-display text-brand-600 dark:text-brand-400 mt-1">
                  {formatINR(prod.price)} <span className="text-[10px] text-slate-400 font-normal">/ {prod.unit}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenModal(prod)}
                  className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(prod._id)}
                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Product Name (EN) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Product Name (HI) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameHi}
                    onChange={(e) => setProductForm({ ...productForm, nameHi: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Unit (e.g. 50kg Bag) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Short Description *</label>
                <input
                  type="text"
                  required
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Product Image (Upload File or URL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-md"
              >
                {submitting ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
