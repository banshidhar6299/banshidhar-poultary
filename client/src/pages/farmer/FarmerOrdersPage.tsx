import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, Truck, XCircle, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatINR, formatDateTime } from '../../api/client';
import { Order, OrderStatus } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

const statusConfig: Record<
  OrderStatus,
  { labelEn: string; labelHi: string; color: string; icon: any }
> = {
  PENDING: {
    labelEn: 'Pending Approval',
    labelHi: 'स्वीकृति हेतु लंबित',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    icon: Clock
  },
  CONFIRMED: {
    labelEn: 'Confirmed / Packing',
    labelHi: 'कन्फर्म / पैकिंग में',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    icon: CheckCircle2
  },
  DELIVERED: {
    labelEn: 'Delivered',
    labelHi: 'डिलीवर हो गया',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    icon: Truck
  },
  CANCELLED: {
    labelEn: 'Cancelled',
    labelHi: 'रद्द कर दिया गया',
    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    icon: XCircle
  }
};

export const FarmerOrdersPage: React.FC = () => {
  const { t, isHindi } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => {
        if (res.data.success) setOrders(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ChickLoader text="Loading your orders..." />;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
          {t.orders.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isHindi ? 'आपके द्वारा दिए गए सभी ऑर्डर्स का विवरण और स्थिति' : 'Track all your product orders and delivery progress'}
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={isHindi ? 'अभी कोई ऑर्डर नहीं है।' : 'No orders placed yet.'}
          description={isHindi ? 'दाना या चूजों का नया ऑर्डर देने के लिए उत्पाद सूची देखें।' : 'Browse products catalog to place your first order.'}
          actionLabel={t.farmer.orderNow}
          onAction={() => (window.location.href = '/farmer/products')}
          icon={ClipboardList}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;

            return (
              <div
                key={order._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {t.orders.orderId}
                    </span>
                    <span className="text-sm font-mono font-black text-brand-700 dark:text-brand-400">
                      {order.orderId}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${config.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{isHindi ? config.labelHi : config.labelEn}</span>
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 font-bold shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {isHindi && item.productNameHi ? item.productNameHi : item.productName}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            {item.quantity} × {formatINR(item.unitPrice)} / {item.unit}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">
                    {order.createdBy === 'ADMIN' ? (
                      <span className="text-brand-600 font-semibold">
                        {isHindi ? 'बंशीधर पोल्ट्री द्वारा जोड़ा गया' : 'Added by Dealer Admin'}
                      </span>
                    ) : (
                      t.orders.total
                    )}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black font-display text-brand-600 dark:text-brand-400">
                      {formatINR(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
