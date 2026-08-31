import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatINR } from '../../api/client';
import { Product, Category } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';

export const FarmerProductsPage: React.FC = () => {
  const { t, isHindi } = useLanguage();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Cart / Order state { [productId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products/active'),
          api.get('/categories/active')
        ]);
        if (prodRes.data.success) setProducts(prodRes.data.data);
        if (catRes.data.success) setCategories(catRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const selectedItems = products.filter((p) => cart[p._id] > 0);
  const totalAmount = selectedItems.reduce((sum, p) => sum + p.price * cart[p._id], 0);

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const itemsPayload = selectedItems.map((p) => ({
        productId: p._id,
        quantity: cart[p._id]
      }));

      const res = await api.post('/orders', {
        items: itemsPayload,
        notes: orderNotes
      });

      if (res.data.success) {
        setCreatedOrderId(res.data.data.orderId);
        setOrderSuccess(true);
        setCart({});
        setOrderNotes('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ChickLoader text="Loading products..." />;

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => {
          const catId = typeof p.category === 'object' ? p.category._id : p.category;
          return catId === selectedCategory;
        });

  if (orderSuccess) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.orders.orderSuccess}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Order ID: <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{createdOrderId}</span>
        </p>
        <p className="text-xs text-slate-500">
          {isHindi
            ? 'बंशीधर पोल्ट्री आपके ऑर्डर की पुष्टि करेगी और डिलीवरी के लिए सूचित किया जाएगा।'
            : 'Banshidhar Poultry administration will confirm and schedule delivery.'}
        </p>
        <div className="pt-4 flex flex-col gap-2">
          <button
            onClick={() => navigate('/farmer/orders')}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            {isHindi ? 'ऑर्डर स्थिति देखें' : 'View Order Status'}
          </button>
          <button
            onClick={() => setOrderSuccess(false)}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
          >
            {isHindi ? 'और उत्पाद ऑर्डर करें' : 'Order More Products'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {t.farmer.bottomNav.products}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isHindi ? 'दाना, चूजे व आवश्यक दवाइयों का सीधा ऑर्डर दें' : 'Order feeds, chicks, and supplements directly'}
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {t.products.allCategories}
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(cat._id)}
            className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all ${
              selectedCategory === cat._id
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {isHindi && cat.nameHi ? cat.nameHi : cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => {
          const qty = cart[prod._id] || 0;
          return (
            <div
              key={prod._id}
              className="flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden"
            >
              <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800">
                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                  {prod.brand}
                </span>
              </div>

              <div className="flex-1 p-5 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isHindi && prod.nameHi ? prod.nameHi : prod.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {isHindi && prod.shortDescriptionHi ? prod.shortDescriptionHi : prod.shortDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black font-display text-slate-900 dark:text-white">
                      {formatINR(prod.price)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      / {isHindi && prod.unitHi ? prod.unitHi : prod.unit}
                    </span>
                  </div>

                  {qty === 0 ? (
                    <button
                      onClick={() => updateQuantity(prod._id, 1)}
                      className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.orders.addToOrder}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => updateQuantity(prod._id, -1)}
                        className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-mono font-bold px-2">{qty}</span>
                      <button
                        onClick={() => updateQuantity(prod._id, 1)}
                        className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Checkout Drawer if items selected */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-4 right-4 max-w-xl mx-auto z-40 p-4 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {selectedItems.length} {isHindi ? 'सामग्री चुनी गई' : 'Items Selected'}
              </span>
              <span className="text-xl font-black font-display text-white">
                {formatINR(totalAmount)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all"
            >
              {submitting ? 'Placing Order...' : t.orders.placeOrder}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
