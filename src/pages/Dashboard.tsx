import React, { useEffect, useMemo, useState } from 'react';
import { Package, X, ExternalLink, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { ThreeShirtViewer } from '../components/customizer/ThreeShirtViewer';
import { Link } from 'react-router-dom';

const ORDER_NOTES_KEY = 'gkap_admin_order_notes_v1';

const COLOR_HEX_MAP: Record<string, string> = {
  white: '#f5f5f5',
  black: '#1f1f1f',
  navy: '#1e3a8a',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#eab308',
  pink: '#ec4899',
  purple: '#7c3aed',
  gray: '#6b7280',
  grey: '#6b7280',
};

const isHexColor = (value?: string) =>
  !!value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

const getItemPreviewImage = (item: any) =>
  item?.design_image_url || item?.custom_designs?.image_url || item?.products?.image_url || null;

const getShirtColorHex = (item: any) => {
  const color = item?.custom_designs?.tshirt_color || item?.color;
  if (!color || typeof color !== 'string') return '#f5f5f5';
  if (isHexColor(color)) return color;
  return COLOR_HEX_MAP[color.toLowerCase()] || '#f5f5f5';
};

const createEmptyProductForm = () => ({
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  category: 'custom',
  collection: 'admin',
  fit: 'regular',
  colorsCsv: 'white,black',
  sizesCsv: 'S,M,L,XL',
  stockQuantity: '0',
  isNew: false,
  isBestSeller: false,
  fabricCare: '',
  shippingInfo: '',
});

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState('');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderTickFilter, setOrderTickFilter] = useState<'all' | 'ticked' | 'unticked'>('all');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [orderDateSort, setOrderDateSort] = useState<'newest' | 'oldest'>('newest');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [existingProductImages, setExistingProductImages] = useState<string[]>([]);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productForm, setProductForm] = useState(createEmptyProductForm());

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem('adminKey');
      if (!adminKey) {
        window.location.href = '/login';
        return;
      }

      const res = await fetch('http://localhost:3001/api/admin/orders', {
        headers: { 'x-admin-key': adminKey },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      } else if (res.status === 401) {
        localStorage.removeItem('adminKey');
        window.location.href = '/login';
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch orders');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/products');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch products');
      }
      const data = await res.json();
      setProducts(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(ORDER_NOTES_KEY);
    if (raw) {
      try {
        setOrderNotes(JSON.parse(raw));
      } catch {
        setOrderNotes({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ORDER_NOTES_KEY, JSON.stringify(orderNotes));
  }, [orderNotes]);

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    window.location.href = '/login';
  };

  const toggleOrderSelected = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const filteredOrders = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();
    return orders
      .filter((order) => {
      const name = `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.toLowerCase();
      const email = (order.shipping_address?.email || '').toLowerCase();
      const orderNo = (order.order_number || order.id || '').toLowerCase();
      const matchesSearch =
        !search || name.includes(search) || email.includes(search) || orderNo.includes(search);
      const isTicked = selectedOrderIds.includes(order.id);
      const matchesTick =
        orderTickFilter === 'all' ||
        (orderTickFilter === 'ticked' ? isTicked : !isTicked);

      const orderDate = new Date(order.created_at);
      const fromDate = orderDateFrom ? new Date(`${orderDateFrom}T00:00:00`) : null;
      const toDate = orderDateTo ? new Date(`${orderDateTo}T23:59:59`) : null;
      const matchesDate = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);

      return matchesSearch && matchesTick && matchesDate;
    })
      .sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return orderDateSort === 'oldest' ? diff : -diff;
      });
  }, [orders, orderSearch, orderTickFilter, orderDateFrom, orderDateTo, orderDateSort, selectedOrderIds]);

  const customOrdersSorted = useMemo(() => {
    return filteredOrders
      .filter((order) =>
        (order.order_items || []).some(
          (item: any) => !!item.design_id || !!item.design_image_url || !!item.custom_designs,
        ),
      );
  }, [filteredOrders]);

  const productCategories = useMemo(() => {
    return Array.from(new Set((products || []).map((p) => p.category).filter(Boolean))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return (products || []).filter((product) => {
      const matchesSearch =
        !search ||
        (product.name || '').toLowerCase().includes(search) ||
        (product.category || '').toLowerCase().includes(search) ||
        (product.collection || '').toLowerCase().includes(search);
      const matchesCategory =
        productCategoryFilter === 'all' || product.category === productCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  const productToForm = (product: any) => ({
    name: product.name || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    originalPrice: product.original_price?.toString() || '',
    category: product.category || 'custom',
    collection: product.collection || 'admin',
    fit: product.fit || 'regular',
    colorsCsv: Array.isArray(product.colors) ? product.colors.join(',') : '',
    sizesCsv: Array.isArray(product.sizes) ? product.sizes.join(',') : '',
    stockQuantity: (product.stock_quantity ?? product.stock ?? 0).toString(),
    isNew: Boolean(product.is_new),
    isBestSeller: Boolean(product.is_bestseller),
    fabricCare: product.fabric_care || '',
    shippingInfo: product.shipping_info || '',
  });

  const buildProductFormData = (
    form: ReturnType<typeof createEmptyProductForm>,
    existingImages: string[],
    imageFiles: File[],
  ) => {
    const colors = form.colorsCsv.split(',').map((s) => s.trim()).filter(Boolean);
    const sizes = form.sizesCsv.split(',').map((s) => s.trim()).filter(Boolean);
    const formData = new FormData();

    formData.append('name', form.name.trim());
    formData.append('description', form.description || '');
    formData.append('price', String(Number.parseFloat(form.price || '0')));
    formData.append('original_price', form.originalPrice ? String(Number.parseFloat(form.originalPrice)) : '');
    formData.append('category', form.category);
    formData.append('collection', form.collection);
    formData.append('fit', form.fit);
    formData.append('colors', JSON.stringify(colors));
    formData.append('sizes', JSON.stringify(sizes));
    formData.append('stock', String(Number.parseInt(form.stockQuantity || '0', 10)));
    formData.append('stock_quantity', String(Number.parseInt(form.stockQuantity || '0', 10)));
    formData.append('is_new', String(form.isNew));
    formData.append('is_bestseller', String(form.isBestSeller));
    formData.append('fabric_care', form.fabricCare || '');
    formData.append('shipping_info', form.shippingInfo || '');
    formData.append(
      'existing_images',
      JSON.stringify(existingImages.map((url, index) => ({ image_url: url, display_order: index }))),
    );

    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    return { formData, colors, sizes };
  };

  const handleCreateProduct = async () => {
    try {
      const { formData, colors, sizes } = buildProductFormData(productForm, [], productImageFiles);
      const parsedPrice = Number.parseFloat(productForm.price || '0');
      if (!productForm.name.trim() || !parsedPrice || colors.length === 0 || sizes.length === 0) {
        setError('Name, price, colors and sizes are required');
        return;
      }
      if (productImageFiles.length === 0) {
        setError('Please upload at least one product photo');
        return;
      }

      const res = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create product');
      }

      await fetchProducts();
      setProductForm(createEmptyProductForm());
      setProductImageFiles([]);
      setExistingProductImages([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;

    try {
      const { formData, colors, sizes } = buildProductFormData(
        productForm,
        existingProductImages,
        productImageFiles,
      );
      const parsedPrice = Number.parseFloat(productForm.price || '0');
      if (!productForm.name.trim() || !parsedPrice || colors.length === 0 || sizes.length === 0) {
        setError('Name, price, colors and sizes are required');
        return;
      }

      const res = await fetch(`http://localhost:3001/api/products/${editingProductId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update product');
      }

      await fetchProducts();
      setEditingProductId(null);
      setProductForm(createEmptyProductForm());
      setProductImageFiles([]);
      setExistingProductImages([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete product');
      }

      await fetchProducts();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete product');
    }
  };

  const handleMoveProduct = async (productId: string, direction: 'up' | 'down') => {
    const currentIndex = products.findIndex((p) => p.id === productId);
    if (currentIndex < 0) return;

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= products.length) return;

    const reordered = [...products];
    const [item] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, item);
    setProducts(reordered);

    try {
      const res = await fetch('http://localhost:3001/api/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: reordered.map((p) => p.id) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product order');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save product order');
      await fetchProducts();
    }
  };

  return (
    <div className="admin-theme min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-[#406093] border-b border-[#4c8ce4] px-6 py-4 flex items-center justify-between text-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-[#91d06c]" />
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="flex items-center gap-2 bg-[#E5E7EB]/20 border border-[#91d06c]/40 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'orders' ? 'bg-[#91d06c] text-[#406093] shadow-sm' : 'text-[#E5E7EB] hover:bg-[#4c8ce4]/40'}`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'products' ? 'bg-[#91d06c] text-[#406093] shadow-sm' : 'text-[#E5E7EB] hover:bg-[#4c8ce4]/40'}`}
          >
            Products
          </button>
        </div>

        <div className="flex gap-4 items-center">
          <Link
            to="/banners"
            className="text-sm font-medium text-[#406093] bg-[#91d06c] hover:bg-[#E5E7EB] px-4 py-2 rounded-lg"
          >
            Banner Slides
          </Link>
          <button
            onClick={() => {
              fetchOrders();
              fetchProducts();
            }}
            className="text-[#91d06c] hover:text-[#E5E7EB]"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-[#406093] bg-[#E5E7EB] hover:bg-[#91d06c] px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-[#4c8ce4]/40 text-[#406093] p-4 rounded-xl">Error: {error}</div>
        )}

        {activeTab === 'orders' && (
          <>
            <div className="bg-white border rounded-2xl p-4 grid md:grid-cols-3 gap-3">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Search order/user/email"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
              <select
                className="border rounded-lg px-3 py-2"
                value={orderTickFilter}
                onChange={(e) => setOrderTickFilter(e.target.value as 'all' | 'ticked' | 'unticked')}
              >
                <option value="all">All Orders</option>
                <option value="ticked">Ticked</option>
                <option value="unticked">Unticked</option>
              </select>
              <select
                className="border rounded-lg px-3 py-2"
                value={orderDateSort}
                onChange={(e) => setOrderDateSort(e.target.value as 'newest' | 'oldest')}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <input
                type="date"
                className="border rounded-lg px-3 py-2"
                value={orderDateFrom}
                onChange={(e) => setOrderDateFrom(e.target.value)}
              />
              <input
                type="date"
                className="border rounded-lg px-3 py-2"
                value={orderDateTo}
                onChange={(e) => setOrderDateTo(e.target.value)}
              />
              <button
                onClick={() => {
                  setOrderDateFrom('');
                  setOrderDateTo('');
                }}
                className="border rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Clear Dates
              </button>
              <div className="text-sm text-slate-600 flex items-center">
                Selected Orders: <span className="font-semibold ml-1">{selectedOrderIds.length}</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="bg-white shadow-sm border rounded-2xl overflow-hidden">
                  <div className="p-4 border-b bg-slate-50 font-medium">Custom Orders (Sorted by Date)</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b text-sm font-medium text-slate-500">
                          <th className="p-3">Tick</th>
                          <th className="p-3">Order</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Total</th>
                          <th className="p-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {customOrdersSorted.map((order) => (
                          <tr
                            key={`custom-${order.id}`}
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={() => toggleOrderSelected(order.id)}
                              />
                            </td>
                            <td className="p-3 font-mono text-slate-700">{order.order_number || order.id.slice(0, 8)}</td>
                            <td className="p-3 font-medium text-slate-900">
                              {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                            </td>
                            <td className="p-3 text-slate-600">{new Date(order.created_at).toLocaleString()}</td>
                            <td className="p-3 font-semibold">₹{order.total}</td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={orderNotes[order.id] || ''}
                                onChange={(e) =>
                                  setOrderNotes((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                placeholder="Add note"
                                className="w-full border rounded-md px-2 py-1 text-xs min-h-[56px]"
                              />
                            </td>
                          </tr>
                        ))}
                        {customOrdersSorted.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500">No custom orders yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white shadow-sm border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b text-sm font-medium text-slate-500">
                          <th className="p-3">Tick</th>
                          <th className="p-3">Order</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Total</th>
                          <th className="p-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={() => toggleOrderSelected(order.id)}
                              />
                            </td>
                            <td className="p-3 font-mono text-slate-700">{order.order_number || order.id.slice(0, 8)}</td>
                            <td className="p-3">
                              <div className="font-medium text-slate-900">
                                {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                              </div>
                              <div className="text-xs text-slate-500">{order.shipping_address?.email}</div>
                            </td>
                            <td className="p-3 text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="p-3 font-semibold text-slate-900">₹{order.total}</td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={orderNotes[order.id] || ''}
                                onChange={(e) =>
                                  setOrderNotes((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                placeholder="Add note"
                                className="w-full border rounded-md px-2 py-1 text-xs min-h-[56px]"
                              />
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'products' && (
          <>
            <div className="bg-white border rounded-2xl p-4 grid md:grid-cols-3 gap-3">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Search product"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <select
                className="border rounded-lg px-3 py-2"
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {productCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="text-sm text-slate-600 flex items-center">
                Showing {filteredProducts.length} products
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">
                {editingProductId ? 'Edit Product' : 'Add Product'}
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                <input className="border rounded-lg px-3 py-2" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Collection" value={productForm.collection} onChange={(e) => setProductForm((p) => ({ ...p, collection: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Fit" value={productForm.fit} onChange={(e) => setProductForm((p) => ({ ...p, fit: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" type="number" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" type="number" placeholder="Original Price" value={productForm.originalPrice} onChange={(e) => setProductForm((p) => ({ ...p, originalPrice: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" type="number" placeholder="Stock Quantity" value={productForm.stockQuantity} onChange={(e) => setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Colors (comma separated)" value={productForm.colorsCsv} onChange={(e) => setProductForm((p) => ({ ...p, colorsCsv: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Sizes (comma separated)" value={productForm.sizesCsv} onChange={(e) => setProductForm((p) => ({ ...p, sizesCsv: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Fabric Care" value={productForm.fabricCare} onChange={(e) => setProductForm((p) => ({ ...p, fabricCare: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Shipping Info" value={productForm.shippingInfo} onChange={(e) => setProductForm((p) => ({ ...p, shippingInfo: e.target.value }))} />
                <div className="md:col-span-2 border rounded-lg px-3 py-2">
                  <div className="text-sm font-medium text-slate-700 mb-2">Upload Product Photos (multiple)</div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setProductImageFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm"
                  />
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {existingProductImages.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative border rounded-md overflow-hidden bg-slate-50">
                        <img src={url} alt={`Existing ${index + 1}`} className="w-full h-20 object-cover" />
                        <button
                          type="button"
                          onClick={() => setExistingProductImages((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded bg-black/70 text-white"
                        >
                          X
                        </button>
                      </div>
                    ))}
                    {productImageFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="border rounded-md p-2 bg-slate-50 text-xs text-slate-700 truncate">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
                <textarea className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={productForm.isNew} onChange={(e) => setProductForm((p) => ({ ...p, isNew: e.target.checked }))} /> Is New</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={productForm.isBestSeller} onChange={(e) => setProductForm((p) => ({ ...p, isBestSeller: e.target.checked }))} /> Is Bestseller</label>
              </div>

              <div className="mt-4 flex gap-3">
                {editingProductId ? (
                  <>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onClick={handleUpdateProduct}>Save Changes</button>
                    <button
                      className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300"
                      onClick={() => {
                        setEditingProductId(null);
                        setProductForm(createEmptyProductForm());
                        setExistingProductImages([]);
                        setProductImageFiles([]);
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onClick={handleCreateProduct}>Add Product</button>
                )}
              </div>
            </div>

            <div className="bg-white shadow-sm border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-sm font-medium text-slate-500">
                      <th className="p-4">Order</th>
                      <th className="p-4">Photo</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(product.id, 'up')}
                              className="p-1 rounded border hover:bg-slate-100"
                              disabled={products.findIndex((p) => p.id === product.id) <= 0}
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(product.id, 'down')}
                              className="p-1 rounded border hover:bg-slate-100"
                              disabled={products.findIndex((p) => p.id === product.id) >= products.length - 1}
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          {Array.isArray(product.images) && product.images.length > 0 ? (
                            <div className="max-w-[260px] overflow-x-auto">
                              <div className="flex gap-2 w-max">
                                {product.images.map((img: any, index: number) => (
                                  <img
                                    key={`${product.id}-img-${index}`}
                                    src={img.image_url}
                                    alt={`${product.name}-${index + 1}`}
                                    className="w-12 h-12 object-cover rounded-md border"
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-md border bg-slate-100 flex items-center justify-center text-xs text-slate-500">No</div>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-900">{product.name}</td>
                        <td className="p-4 text-slate-600">{product.category}</td>
                        <td className="p-4 font-semibold">₹{product.price}</td>
                        <td className="p-4 text-slate-700">{product.stock_quantity ?? product.stock ?? 0}</td>
                        <td className="p-4 flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              setEditingProductId(product.id);
                              setProductForm(productToForm(product));
                              setExistingProductImages(
                                Array.isArray(product.images)
                                  ? product.images.map((img: any) => img.image_url).filter(Boolean)
                                  : [],
                              );
                              setProductImageFiles([]);
                            }}
                          >
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && !productsLoading && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Order {selectedOrder.order_number || selectedOrder.id}</h3>
                <p className="text-sm text-slate-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200" onClick={() => setSelectedOrder(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Customer</h4>
                <p className="text-sm text-slate-700">{selectedOrder.shipping_address?.firstName} {selectedOrder.shipping_address?.lastName}</p>
                <p className="text-sm text-slate-700">{selectedOrder.shipping_address?.email}</p>
                <p className="text-sm text-slate-700">{selectedOrder.shipping_address?.phone}</p>
                <h4 className="font-semibold mt-4 mb-2">Address</h4>
                <p className="text-sm text-slate-700">{selectedOrder.shipping_address?.address}, {selectedOrder.shipping_address?.apartment}</p>
                <p className="text-sm text-slate-700">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.zip}</p>
                <p className="text-sm text-slate-700">{selectedOrder.shipping_address?.country}</p>
                <h4 className="font-semibold mt-4 mb-2">Notes</h4>
                <textarea
                  className="w-full border rounded-md px-2 py-2 text-sm min-h-[90px]"
                  value={orderNotes[selectedOrder.id] || ''}
                  onChange={(e) => setOrderNotes((prev) => ({ ...prev, [selectedOrder.id]: e.target.value }))}
                  placeholder="Add description/note for this order"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Order Summary</h4>
                <p className="text-sm text-slate-700">Order ID: {selectedOrder.id}</p>
                <p className="text-sm text-slate-700">Status: {selectedOrder.status}</p>
                <p className="text-sm text-slate-700">Payment: {selectedOrder.payment_method}</p>
                <p className="text-sm text-slate-700">Total: ₹{selectedOrder.total}</p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <h4 className="font-semibold mb-3">Items & Images</h4>
              <div className="space-y-3">
                {(selectedOrder.order_items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 border rounded-xl p-3">
                    {getItemPreviewImage(item) ? (
                      <img src={getItemPreviewImage(item)} alt="Item" className="w-14 h-14 object-cover rounded-lg border bg-white" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border bg-slate-100 flex items-center justify-center text-xs text-slate-500">No Image</div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.design_id ? 'Custom 3D T-Shirt' : item.products?.name || 'Product'}</div>
                      <div className="text-xs text-slate-500">{item.color} • {item.size} • Qty: {item.quantity}</div>
                    </div>
                    {getItemPreviewImage(item) && (
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-2 rounded-md text-blue-600 hover:bg-blue-50"
                        title="View Design"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative border border-slate-700">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-lg">Custom 3D Design Preview</h3>
                <p className="text-sm text-slate-400">
                  {(selectedItem.custom_designs?.tshirt_color || selectedItem.color)} • {selectedItem.size} • Qty: {selectedItem.quantity}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-slate-800">
              <div className="bg-slate-900 p-4">
                <div className="h-[400px] md:h-[500px] w-full bg-slate-950 rounded-xl overflow-hidden">
                  <ThreeShirtViewer
                    colorHex={getShirtColorHex(selectedItem)}
                    textureUrl={getItemPreviewImage(selectedItem)}
                  />
                </div>
              </div>

              <div className="bg-slate-900 p-4 flex flex-col">
                <h4 className="text-slate-300 font-medium mb-3">Cropped Print Texture</h4>
                <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 p-4">
                  <a
                    href={getItemPreviewImage(selectedItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group w-full h-full cursor-zoom-in"
                  >
                    <img
                      src={getItemPreviewImage(selectedItem)}
                      alt="Print Texture Map"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                        Open Full Image
                      </div>
                    </div>
                  </a>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={getItemPreviewImage(selectedItem)}
                    download="print_texture.png"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Download Texture
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
