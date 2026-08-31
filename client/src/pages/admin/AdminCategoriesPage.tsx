import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit, Trash2, X } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Category } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';

export const AdminCategoriesPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameHi: '',
    description: '',
    descriptionHi: '',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    displayOrder: 0,
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setForm({
        name: cat.name,
        nameHi: cat.nameHi,
        description: cat.description || '',
        descriptionHi: cat.descriptionHi || '',
        imageUrl: cat.imageUrl || '',
        displayOrder: cat.displayOrder || 0,
        isActive: cat.isActive
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: '',
        nameHi: '',
        description: '',
        descriptionHi: '',
        imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
        displayOrder: categories.length + 1,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, form);
      } else {
        await api.post('/categories', form);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await api.delete(`/categories/${id}`);
      if (res.data.success) loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  if (loading) return <ChickLoader text="Loading categories..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'उत्पाद श्रेणियां' : 'Product Categories'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, manage and order product categories
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  Order: {cat.displayOrder}
                </span>
              </div>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">{cat.nameHi}</p>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{cat.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => handleOpenModal(cat)}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(cat._id)}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Category Name (English) *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Category Name (Hindi) *</label>
                <input
                  type="text"
                  required
                  value={form.nameHi}
                  onChange={(e) => setForm({ ...form, nameHi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
              >
                {submitting ? 'Saving...' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
