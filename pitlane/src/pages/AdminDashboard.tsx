import React, {useEffect, useState} from 'react';
import {
  BarChart3,
  Box,
  FileText,
  Megaphone,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {useApp} from '../context/AppContext';

type AdminSection = 'overview' | 'products' | 'orders' | 'whatsapp' | 'marketing' | 'customers' | 'audit';

export function AdminDashboard() {
  const {user, navigate, showToast, bootstrap} = useApp();
  const [section, setSection] = useState<AdminSection>('overview');

  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [waData, setWaData] = useState<any>(null);
  const [marketing, setMarketing] = useState<any>(null);
  const [customersData, setCustomersData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // New Product Form
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pPrice, setPPrice] = useState('12500');
  const [pDesc, setPDesc] = useState('');
  const [pCatId, setPCatId] = useState('1');
  const [pColId, setPColId] = useState('1');
  const [pGender, setPGender] = useState<'UNISEX' | 'MALE' | 'FEMALE'>('UNISEX');
  const [pImg, setPImg] = useState('/src/assets/images/product_apex_hoodie_1795087933583.jpg');

  // New Collection
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');

  // WhatsApp Config Form
  const [waPhone, setWaPhone] = useState('');
  const [waWaba, setWaWaba] = useState('');
  const [waPid, setWaPid] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waVerify, setWaVerify] = useState('');
  const [waAdminPhone, setWaAdminPhone] = useState('');
  const [waHighVal, setWaHighVal] = useState('25000');

  // Coupon & News
  const [cCode, setCCode] = useState('');
  const [cType, setCType] = useState<'PERCENT' | 'FIXED_PKR'>('PERCENT');
  const [cVal, setCVal] = useState('15');
  const [annText, setAnnText] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsBody, setNewsBody] = useState('');

  const loadSection = async (sec: AdminSection) => {
    if (sec === 'overview') {
      const r = await fetch('/api/admin/overview');
      if (r.ok) setOverview(await r.json());
    } else if (sec === 'products') {
      const r = await fetch('/api/admin/products');
      if (r.ok) setProducts((await r.json()).products || []);
    } else if (sec === 'orders') {
      const r = await fetch('/api/admin/orders');
      if (r.ok) setOrders((await r.json()).orders || []);
    } else if (sec === 'whatsapp') {
      const r = await fetch('/api/admin/whatsapp');
      if (r.ok) {
        const d = await r.json();
        setWaData(d);
        setWaPhone(d.config.business_phone || '');
        setWaWaba(d.config.waba_id || '');
        setWaPid(d.config.phone_number_id || '');
        setWaAdminPhone(d.config.admin_notify_phone || '');
        setWaHighVal(String(d.config.notify_high_value_pkr || 25000));
      }
    } else if (sec === 'marketing') {
      const r = await fetch('/api/admin/marketing');
      if (r.ok) {
        const d = await r.json();
        setMarketing(d);
        setAnnText(d.settings?.announcement_bar?.text || '');
      }
    } else if (sec === 'customers') {
      const r = await fetch('/api/admin/customers');
      if (r.ok) setCustomersData(await r.json());
    } else if (sec === 'audit') {
      const r = await fetch('/api/admin/audit-logs');
      if (r.ok) setAuditLogs((await r.json()).logs || []);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadSection(section);
    }
  }, [user, section]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-10 h-10 text-[#EF2929] mx-auto" />
        <h1 className="font-display text-4xl text-white uppercase mt-4">Admin Access Required</h1>
        <p className="text-sm text-[#C6C6C7] mt-2">
          Sign in with an administrator account to access PITLANE operations, inventory, order
          fulfilment, and WhatsApp Cloud API settings.
        </p>
        <button
          type="button"
          onClick={() => navigate('/account')}
          className="mt-6 h-11 px-6 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const navItems: Array<{id: AdminSection; label: string; icon: React.ReactNode}> = [
    {id: 'overview', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />},
    {id: 'orders', label: 'Orders', icon: <PackageCheck className="w-4 h-4" />},
    {id: 'products', label: 'Products & Stock', icon: <Box className="w-4 h-4" />},
    {id: 'whatsapp', label: 'WhatsApp API', icon: <MessageSquare className="w-4 h-4" />},
    {id: 'marketing', label: 'Marketing & News', icon: <Megaphone className="w-4 h-4" />},
    {id: 'customers', label: 'Customers & Consent', icon: <Users className="w-4 h-4" />},
    {id: 'audit', label: 'Audit Logs', icon: <FileText className="w-4 h-4" />},
  ];

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: pName,
        skuPrefix: pSku,
        description: pDesc,
        basePricePkr: Number(pPrice),
        categoryId: Number(pCatId),
        collectionId: Number(pColId),
        gender: pGender,
        imageUrl: pImg,
        isNewArrival: true,
        variants: [
          {size: 'M', colorName: 'Matte Black', colorHex: '#111315', stockQty: 10},
          {size: 'L', colorName: 'Matte Black', colorHex: '#111315', stockQty: 10},
        ],
      }),
    });
    if (res.ok) {
      setPName('');
      setPSku('');
      setPDesc('');
      showToast('Product created with M/L variants');
      loadSection('products');
    } else {
      const d = await res.json();
      showToast(d.error || 'Error creating product');
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
      <div className="pb-5 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono-tabular text-xs uppercase text-[#EF2929]">
            PITLANE Operations Console · {user.email}
          </p>
          <h1 className="font-display text-3xl md:text-5xl text-white uppercase mt-1">
            Admin Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={() => loadSection(section)}
          className="h-10 px-4 border border-[#27272A] hover:border-white text-xs font-mono-tabular uppercase text-white flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh View</span>
        </button>
      </div>

      {/* Responsive Admin Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        <aside className="lg:col-span-3">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`h-11 px-4 flex items-center gap-3 text-xs font-mono-tabular uppercase border transition-colors whitespace-nowrap shrink-0 ${
                  section === item.id
                    ? 'bg-[#EF2929] border-[#EF2929] text-white font-semibold'
                    : 'bg-[#181A1D] border-[#27272A] text-[#C6C6C7] hover:border-white hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-9 min-w-0">
          {/* OVERVIEW */}
          {section === 'overview' && overview && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Gross Revenue',
                    val: `PKR ${Math.round(overview.sales.total_revenue_pkr || 0).toLocaleString()}`,
                  },
                  {label: 'Total Orders', val: String(overview.sales.total_orders || 0)},
                  {
                    label: 'Avg Order Value',
                    val: `PKR ${Math.round(overview.sales.avg_order_value_pkr || 0).toLocaleString()}`,
                  },
                  {label: 'Pending Fulfilment', val: String(overview.sales.pending_fulfilment || 0)},
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[#181A1D] border border-[#27272A] p-5">
                    <p className="font-mono-tabular text-[11px] uppercase text-[#71717A]">{kpi.label}</p>
                    <p className="font-mono-tabular text-xl md:text-2xl font-semibold text-white mt-2">
                      {kpi.val}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#181A1D] border border-[#27272A] p-5">
                  <h2 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                    Low Stock Alerts (≤ 5 Units)
                  </h2>
                  <div className="mt-3 space-y-2 text-xs font-mono-tabular">
                    {(overview.lowStock || []).map((v: any) => (
                      <div key={v.id} className="flex justify-between py-1.5 border-b border-[#27272A]/60">
                        <span className="text-white truncate pr-2">
                          {v.product_name} ({v.size})
                        </span>
                        <span className="text-[#EF2929] font-semibold shrink-0">
                          {v.stock_qty} left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#181A1D] border border-[#27272A] p-5">
                  <h2 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                    WhatsApp Dispatch Telemetry
                  </h2>
                  <div className="mt-3 space-y-2 text-xs font-mono-tabular">
                    {(overview.waStats || []).length === 0 ? (
                      <p className="text-[#71717A]">No WhatsApp notifications logged yet.</p>
                    ) : (
                      overview.waStats.map((w: any) => (
                        <div key={w.delivery_status} className="flex justify-between py-1.5 border-b border-[#27272A]/60">
                          <span className="text-[#C6C6C7]">{w.delivery_status}</span>
                          <span className="text-white font-semibold">{w.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {section === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-[#181A1D] border border-[#27272A] p-8 text-sm text-[#71717A]">
                  No orders recorded yet. Complete a test checkout to manage fulfilment here.
                </div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="bg-[#181A1D] border border-[#27272A] p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#27272A] pb-3">
                      <div>
                        <p className="font-mono-tabular text-sm font-semibold text-white">
                          {o.order_number} · {o.customer_name}
                        </p>
                        <p className="text-xs text-[#C6C6C7] mt-0.5">
                          {o.city}, {o.country} · {o.phone} · {o.guest_email}
                        </p>
                      </div>
                      <div className="font-mono-tabular text-right text-xs">
                        <p className="text-white font-semibold">
                          PKR {Number(o.total_pkr).toLocaleString()} ({o.payment_method})
                        </p>
                        <p className="text-[#71717A]">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                          Order Status
                        </label>
                        <select
                          value={o.order_status}
                          onChange={async (e) => {
                            await fetch(`/api/admin/orders/${o.id}`, {
                              method: 'PATCH',
                              headers: {'Content-Type': 'application/json'},
                              body: JSON.stringify({orderStatus: e.target.value}),
                            });
                            showToast(`Updated ${o.order_number} status`);
                            loadSection('orders');
                          }}
                          className="w-full h-10 px-2.5 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                        >
                          {[
                            'RECEIVED',
                            'CONFIRMED',
                            'PROCESSING',
                            'SHIPPED',
                            'OUT_FOR_DELIVERY',
                            'DELIVERED',
                            'CANCELLED',
                          ].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                          Payment Status
                        </label>
                        <select
                          value={o.payment_status}
                          onChange={async (e) => {
                            await fetch(`/api/admin/orders/${o.id}`, {
                              method: 'PATCH',
                              headers: {'Content-Type': 'application/json'},
                              body: JSON.stringify({paymentStatus: e.target.value}),
                            });
                            showToast(`Payment status updated`);
                            loadSection('orders');
                          }}
                          className="w-full h-10 px-2.5 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                        >
                          {['PENDING', 'AWAITING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED'].map((ps) => (
                            <option key={ps} value={ps}>
                              {ps}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                          Tracking Code
                        </label>
                        <input
                          defaultValue={o.tracking_code}
                          placeholder="TCS-992817"
                          onBlur={async (e) => {
                            if (e.target.value !== o.tracking_code) {
                              await fetch(`/api/admin/orders/${o.id}`, {
                                method: 'PATCH',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({
                                  trackingCode: e.target.value,
                                  courierName: o.country === 'Pakistan' ? 'TCS Express' : 'DHL Express',
                                }),
                              });
                              showToast('Tracking code saved');
                            }
                          }}
                          className="w-full h-10 px-2.5 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRODUCTS & STOCK */}
          {section === 'products' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={handleCreateProduct} className="bg-[#181A1D] border border-[#27272A] p-5 space-y-3">
                  <h2 className="font-display text-2xl text-white uppercase">Create Product</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="Product Name"
                      className="h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                    />
                    <input
                      required
                      value={pSku}
                      onChange={(e) => setPSku(e.target.value)}
                      placeholder="SKU Prefix (PTL-XX-09)"
                      className="h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs font-mono-tabular uppercase text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      required
                      type="number"
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      placeholder="Price PKR"
                      className="h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs font-mono-tabular text-white"
                    />
                    <select
                      value={pCatId}
                      onChange={(e) => setPCatId(e.target.value)}
                      className="h-10 px-2 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                    >
                      {(bootstrap?.categories || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={pColId}
                      onChange={(e) => setPColId(e.target.value)}
                      className="h-10 px-2 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                    >
                      {(bootstrap?.collections || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={pGender}
                      onChange={(e) => setPGender(e.target.value as 'UNISEX' | 'MALE' | 'FEMALE')}
                      className="h-10 px-2 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                    >
                      <option value="UNISEX">Unisex</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <input
                    required
                    value={pImg}
                    onChange={(e) => setPImg(e.target.value)}
                    placeholder="Image Path"
                    className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                  />
                  <textarea
                    required
                    rows={2}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    placeholder="Technical description..."
                    className="w-full p-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="h-10 px-5 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase"
                  >
                    Create Product
                  </button>
                </form>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const r = await fetch('/api/admin/collections', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({name: colName, description: colDesc, isFeatured: true}),
                    });
                    if (r.ok) {
                      setColName('');
                      setColDesc('');
                      showToast('Collection created');
                    }
                  }}
                  className="bg-[#181A1D] border border-[#27272A] p-5 space-y-3 self-start"
                >
                  <h2 className="font-display text-2xl text-white uppercase">Add Dynamic Collection</h2>
                  <input
                    required
                    value={colName}
                    onChange={(e) => setColName(e.target.value)}
                    placeholder="Collection Title (e.g. Night Qualifying)"
                    className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    value={colDesc}
                    onChange={(e) => setColDesc(e.target.value)}
                    placeholder="Collection description"
                    className="w-full p-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="h-10 px-5 border border-white text-white hover:bg-white hover:text-[#111315] font-mono-tabular text-xs uppercase"
                  >
                    Create Collection
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="bg-[#181A1D] border border-[#27272A] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {p.name} {!p.active && <span className="text-[#EF2929]">(Archived)</span>}
                        </p>
                        <p className="font-mono-tabular text-xs text-[#71717A]">
                          {p.sku_prefix} · {p.category_name} · PKR {p.base_price_pkr.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/products/${p.id}`, {method: 'DELETE'});
                          showToast('Product archived');
                          loadSection('products');
                        }}
                        className="text-xs font-mono-tabular text-[#71717A] hover:text-[#EF2929]"
                      >
                        Archive
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(p.variants || []).map((v: any) => (
                        <div
                          key={v.id}
                          className="bg-[#090A0B] border border-[#27272A] px-3 py-1.5 flex items-center gap-2 text-xs font-mono-tabular"
                        >
                          <span className="text-[#C6C6C7]">
                            {v.size} ({v.color_name})
                          </span>
                          <input
                            type="number"
                            min={0}
                            defaultValue={v.stock_qty}
                            onBlur={async (e) => {
                              const val = Number(e.target.value);
                              if (val !== v.stock_qty) {
                                await fetch(`/api/admin/variants/${v.id}/stock`, {
                                  method: 'PATCH',
                                  headers: {'Content-Type': 'application/json'},
                                  body: JSON.stringify({stockQty: val}),
                                });
                                showToast(`Stock updated for ${v.sku}`);
                              }
                            }}
                            className="w-16 h-7 px-1.5 bg-[#181A1D] border border-[#27272A] text-white text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WHATSAPP BUSINESS CLOUD API */}
          {section === 'whatsapp' && waData && (
            <div className="space-y-8">
              <div className="bg-[#181A1D] border border-[#27272A] p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A] pb-3">
                  <div>
                    <h2 className="font-display text-2xl text-white uppercase">
                      WhatsApp Business Platform Configuration
                    </h2>
                    <p className="font-mono-tabular text-xs text-[#C6C6C7] mt-1">
                      Cloud API Status:{' '}
                      <span className={waData.config.cloud_api_ready ? 'text-[#25D366]' : 'text-[#EF2929]'}>
                        {waData.config.cloud_api_ready
                          ? 'CONNECTED (Graph API Ready)'
                          : 'CLICK-TO-CHAT FALLBACK (Add Phone Number ID & Token for server push)'}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await fetch('/api/admin/whatsapp/test', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({phone: waPhone}),
                      });
                      const d = await r.json();
                      showToast(`WhatsApp test result: ${d.status}`);
                      loadSection('whatsapp');
                    }}
                    className="h-10 px-4 border border-white text-white hover:bg-white hover:text-[#111315] font-mono-tabular text-xs uppercase"
                  >
                    Test Connection
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/admin/whatsapp/config', {
                      method: 'PATCH',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        business_phone: waPhone,
                        waba_id: waWaba,
                        phone_number_id: waPid,
                        access_token: waToken,
                        webhook_verify_token: waVerify,
                        admin_notify_phone: waAdminPhone,
                        notify_high_value_pkr: Number(waHighVal),
                        notify_new_order: true,
                        notify_payment: true,
                        notify_low_stock: true,
                      }),
                    });
                    setWaToken('');
                    setWaVerify('');
                    showToast('WhatsApp credentials saved securely');
                    loadSection('whatsapp');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                >
                  <div>
                    <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                      Business Phone (Click-to-Chat)
                    </label>
                    <input
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                      Admin Alert Phone
                    </label>
                    <input
                      value={waAdminPhone}
                      onChange={(e) => setWaAdminPhone(e.target.value)}
                      placeholder="+92300..."
                      className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                      WABA ID
                    </label>
                    <input
                      value={waWaba}
                      onChange={(e) => setWaWaba(e.target.value)}
                      className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                      Phone Number ID
                    </label>
                    <input
                      value={waPid}
                      onChange={(e) => setWaPid(e.target.value)}
                      className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                      API Access Token ({waData.config.access_token_masked || 'Not Set'})
                    </label>
                    <input
                      type="password"
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                      placeholder="Enter new Meta permanent token to update"
                      className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                      Webhook Verify Token ({waData.config.webhook_verify_token_masked || 'Default'})
                    </label>
                    <input
                      type="password"
                      value={waVerify}
                      onChange={(e) => setWaVerify(e.target.value)}
                      placeholder="Enter verify token"
                      className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-tabular uppercase text-[#71717A] mb-1">
                      High-Value Order Threshold (PKR)
                    </label>
                    <input
                      type="number"
                      value={waHighVal}
                      onChange={(e) => setWaHighVal(e.target.value)}
                      className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-white font-mono-tabular"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="h-10 px-6 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>

              {/* Abandoned Carts */}
              <div className="bg-[#181A1D] border border-[#27272A] p-5">
                <h3 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                  Abandoned Cart Recovery Queue
                </h3>
                <div className="mt-3 space-y-2 text-xs">
                  {(waData.abandonedCarts || []).length === 0 ? (
                    <p className="text-[#71717A]">No abandoned carts waiting recovery.</p>
                  ) : (
                    waData.abandonedCarts.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[#27272A]"
                      >
                        <div>
                          <p className="text-white font-semibold">
                            {c.customer_name || c.customer_email || 'Guest'} · PKR{' '}
                            {Number(c.subtotal_pkr).toLocaleString()}
                          </p>
                          <p className="font-mono-tabular text-[#71717A]">
                            Phone: {c.customer_phone || 'None'} · Consent:{' '}
                            {c.whatsapp_opt_in ? 'OPTED IN' : 'NO CONSENT'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const r = await fetch(`/api/admin/whatsapp/abandoned-cart/${c.id}/recover`, {
                              method: 'POST',
                            });
                            const d = await r.json();
                            showToast(d.error || `Recovery dispatch: ${d.status}`);
                            loadSection('whatsapp');
                          }}
                          className="h-9 px-3 border border-[#27272A] hover:border-[#EF2929] font-mono-tabular uppercase text-white"
                        >
                          Send Recovery
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Message History */}
              <div className="bg-[#181A1D] border border-[#27272A] p-5 overflow-x-auto">
                <h3 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                  WhatsApp Communication Logs
                </h3>
                <table className="w-full text-left font-mono-tabular text-xs mt-3">
                  <thead className="border-b border-[#27272A] text-[#71717A]">
                    <tr>
                      <th className="py-2 pr-3">Event</th>
                      <th className="py-2 pr-3">Recipient</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Message / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {(waData.messages || []).map((m: any) => (
                      <tr key={m.id}>
                        <td className="py-2 pr-3 text-white">{m.event_key}</td>
                        <td className="py-2 pr-3 text-[#C6C6C7]">{m.recipient_phone}</td>
                        <td className="py-2 pr-3 text-[#EF2929]">{m.delivery_status}</td>
                        <td className="py-2 text-[#71717A] max-w-md truncate">
                          {m.error_message || m.message_body}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MARKETING & NEWS */}
          {section === 'marketing' && marketing && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/admin/coupons', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        code: cCode,
                        discountType: cType,
                        discountValue: Number(cVal),
                      }),
                    });
                    setCCode('');
                    showToast('Coupon created');
                    loadSection('marketing');
                  }}
                  className="bg-[#181A1D] border border-[#27272A] p-5 space-y-3"
                >
                  <h2 className="font-display text-2xl text-white uppercase">Create Promo Coupon</h2>
                  <input
                    required
                    value={cCode}
                    onChange={(e) => setCCode(e.target.value)}
                    placeholder="CODE (e.g. MONZA20)"
                    className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs font-mono-tabular uppercase text-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={cType}
                      onChange={(e) => setCType(e.target.value as any)}
                      className="h-10 px-2 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                    >
                      <option value="PERCENT">Percent (%)</option>
                      <option value="FIXED_PKR">Fixed PKR</option>
                    </select>
                    <input
                      required
                      type="number"
                      value={cVal}
                      onChange={(e) => setCVal(e.target.value)}
                      className="h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs font-mono-tabular text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-10 px-5 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase"
                  >
                    Create Coupon
                  </button>
                </form>

                <div className="bg-[#181A1D] border border-[#27272A] p-5 space-y-3">
                  <h2 className="font-display text-2xl text-white uppercase">Announcement Bar</h2>
                  <input
                    value={annText}
                    onChange={(e) => setAnnText(e.target.value)}
                    className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch('/api/admin/settings', {
                        method: 'PATCH',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                          key: 'announcement_bar',
                          value: {enabled: true, text: annText},
                        }),
                      });
                      showToast('Announcement bar updated');
                    }}
                    className="h-10 px-5 border border-white text-white font-mono-tabular text-xs uppercase"
                  >
                    Update Banner
                  </button>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch('/api/admin/news', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      title: newsTitle,
                      summary: newsSummary,
                      content: newsBody,
                      category: 'Editorial',
                    }),
                  });
                  setNewsTitle('');
                  setNewsSummary('');
                  setNewsBody('');
                  showToast('Article published to Racing Centre');
                }}
                className="bg-[#181A1D] border border-[#27272A] p-5 space-y-3"
              >
                <h2 className="font-display text-2xl text-white uppercase">Publish Racing Centre Article</h2>
                <input
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="Article Headline"
                  className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                />
                <input
                  required
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  placeholder="Short Summary"
                  className="w-full h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                />
                <textarea
                  required
                  rows={3}
                  value={newsBody}
                  onChange={(e) => setNewsBody(e.target.value)}
                  placeholder="Full editorial body..."
                  className="w-full p-3 bg-[#090A0B] border border-[#27272A] text-xs text-white"
                />
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase"
                >
                  Publish Article
                </button>
              </form>
            </div>
          )}

          {/* CUSTOMERS & CONSENT */}
          {section === 'customers' && customersData && (
            <div className="space-y-6">
              <div className="bg-[#181A1D] border border-[#27272A] p-5 overflow-x-auto">
                <h2 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                  Registered Customers
                </h2>
                <table className="w-full text-left font-mono-tabular text-xs mt-3">
                  <thead className="border-b border-[#27272A] text-[#71717A]">
                    <tr>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Orders</th>
                      <th className="py-2 pr-3">Spend (PKR)</th>
                      <th className="py-2">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {(customersData.customers || []).map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-2 pr-3 text-white font-sans">{c.name}</td>
                        <td className="py-2 pr-3 text-[#C6C6C7]">{c.email}</td>
                        <td className="py-2 pr-3 text-white">{c.order_count}</td>
                        <td className="py-2 pr-3 text-white">
                          {Number(c.lifetime_spend_pkr).toLocaleString()}
                        </td>
                        <td className="py-2 text-[#EF2929]">
                          {c.whatsapp_opt_in ? 'OPT-IN' : 'OFF'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#181A1D] border border-[#27272A] p-5 overflow-x-auto">
                <h2 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                  Consent Audit Trail
                </h2>
                <table className="w-full text-left font-mono-tabular text-xs mt-3">
                  <thead className="border-b border-[#27272A] text-[#71717A]">
                    <tr>
                      <th className="py-2 pr-3">Channel</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Contact</th>
                      <th className="py-2 pr-3">Granted</th>
                      <th className="py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {(customersData.consentRecords || []).map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3 text-white">{r.channel}</td>
                        <td className="py-2 pr-3 text-[#C6C6C7]">{r.consent_type}</td>
                        <td className="py-2 pr-3 text-[#C6C6C7]">{r.phone || r.email}</td>
                        <td className="py-2 pr-3 text-[#EF2929]">{r.granted ? 'YES' : 'NO'}</td>
                        <td className="py-2 text-[#71717A]">{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT LOGS */}
          {section === 'audit' && (
            <div className="bg-[#181A1D] border border-[#27272A] p-5 overflow-x-auto">
              <h2 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                Security &amp; Administrative Audit Logs
              </h2>
              <table className="w-full text-left font-mono-tabular text-xs mt-3">
                <thead className="border-b border-[#27272A] text-[#71717A]">
                  <tr>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Actor</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2 pr-3">Entity</th>
                    <th className="py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 pr-3 text-[#71717A] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-white">{log.actor_email}</td>
                      <td className="py-2 pr-3 text-[#EF2929]">{log.action}</td>
                      <td className="py-2 pr-3 text-[#C6C6C7]">
                        {log.entity_type} {log.entity_id}
                      </td>
                      <td className="py-2 text-[#71717A] max-w-xs truncate">{log.details_json}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
