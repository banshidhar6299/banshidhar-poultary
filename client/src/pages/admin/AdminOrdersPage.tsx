import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle,
  Truck,
  XCircle,
  Clock,
  Plus,
  Package,
  X
} from 'lucide-react';
import { api, formatINR, formatDateTime } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Order, OrderStatus, Product, User } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const AdminOrdersPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Create Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [farmers, setFarmers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let url = `/orders?`;
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
      if (search) url += `search=${search}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const loadModalData = async () => {
    try {
      const [fRes, pRes] = await Promise.all([
        api.get('/farmers?limit=100'),
        api.get('/products/active')
      ]);
      if (fRes.data.success) {
        setFarmers(fRes.data.data);
        if (fRes.data.data.length > 0) setSelectedFarmerId(fRes.data.data[0]._id || fRes.data.data[0].id);
      }
      if (pRes.data.success) setProducts(pRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    loadModalData();
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status });
      if (res.data.success) {
        loadOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.keys(cart)
      .filter((pId) => cart[pId] > 0)
      .map((pId) => ({
        productId: pId,
        quantity: cart[pId]
      }));

    if (!selectedFarmerId || items.length === 0) {
      alert('Please select a farmer and at least one product quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        targetFarmerId: selectedFarmerId,
        items,
        notes: orderNotes
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setCart({});
        setOrderNotes('');
        loadOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'ऑर्डर प्रबंधन' : 'Farmer Orders Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isHindi ? 'किसानों के सभी ऑर्डर देखें, स्थिति बदलें और नया ऑर्डर बनाएं' : 'Track incoming farmer orders, confirm shipments, and create direct orders'}
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isHindi ? 'किसान के लिए नया ऑर्डर जोड़ें' : 'Create Order for Farmer'}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID or Farmer name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">PENDING (लंबित)</option>
          <option value="CONFIRMED">CONFIRMED (कन्फर्म)</option>
          <option value="DELIVERED">DELIVERED (डिलीवर)</option>
          <option value="CANCELLED">CANCELLED (रद्द)</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <ChickLoader text="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Incoming orders from farmers or admin created orders will appear here."
          icon={ClipboardList}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono font-black text-sm text-brand-600 dark:text-brand-400 block">
                    {order.orderId}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                    Farmer: {order.farmerName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : order.status === 'CONFIRMED'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : order.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-1 text-xs">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                    <span className="text-slate-700 dark:text-slate-300">
                      {it.quantity} × {it.productName} (@ {formatINR(it.unitPrice)}/{it.unit})
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(it.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-500 font-bold">Total: </span>
                  <span className="text-base font-black font-display text-brand-600 dark:text-brand-400">
                    {formatINR(order.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'CONFIRMED')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Confirm Order
                    </button>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Mark Delivered (Post Debit)
                    </button>
                  )}

                  {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'CANCELLED')}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Order for Farmer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Order for Farmer
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Farmer *</label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  {farmers.map((f) => (
                    <option key={f.id || (f as any)._id} value={f.id || (f as any)._id}>
                      {f.farmerId} - {f.name} ({f.village})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Select Products & Quantities</label>
                <div className="max-h-56 overflow-y-auto space-y-2 border rounded-xl p-2 bg-slate-50 dark:bg-slate-950">
                  {products.map((p) => (
                    <div key={p._id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <span className="text-[10px] text-slate-400">{formatINR(p.price)} / {p.unit}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cart[p._id] || ''}
                        onChange={(e) => setCart({ ...cart, [p._id]: Number(e.target.value) })}
                        className="w-20 p-1.5 rounded-lg border text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Order Notes (Optional)</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Delivered by tractor vehicle"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-md"
              >
                {submitting ? 'Creating...' : 'Submit Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
