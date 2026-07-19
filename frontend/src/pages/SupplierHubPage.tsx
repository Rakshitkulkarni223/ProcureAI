import React, { useEffect, useState, useCallback } from 'react';
import {
  Store, Plus, Eye, Pencil, Trash2, ArrowLeft, Package, Star,
  Phone, Mail, MapPin, Clock, CreditCard, FileText, X,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SupplierHubIntelligence } from '../components/SupplierHubIntelligence';
import { supplierHubApi, supplierHubApiError } from '../lib/supplierHubApi';
import {
  SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_OPTIONS,
  type SupplierHubSupplier, type SupplierHubProduct,
} from '../types_supplier';
import { cn } from '../lib/utils';

type View = 'list' | 'detail' | 'form';

const EMPTY_FORM: Partial<SupplierHubSupplier> = {
  name: '', supplierType: 'marketplace', businessName: '', gstNumber: '',
  contactPerson: '', phone: '', email: '', address: '', city: '', state: '',
  country: 'India', deliveryDays: undefined, creditPeriod: undefined,
  minimumOrderQuantity: undefined, deliveryCharges: undefined, paymentTerms: '',
  reliabilityScore: undefined, preferredCategories: [], notes: '', active: true,
};

const EMPTY_PRODUCT: Partial<SupplierHubProduct> = {
  productName: '', brand: '', category: '', unit: '', currentPrice: undefined,
  moq: undefined, availability: 'In Stock', notes: '',
};

export function SupplierHubPage() {
  const [view, setView] = useState<View>('list');
  const [suppliers, setSuppliers] = useState<SupplierHubSupplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierHubSupplier | null>(null);
  const [products, setProducts] = useState<SupplierHubProduct[]>([]);
  const [form, setForm] = useState<Partial<SupplierHubSupplier>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIntel, setShowIntel] = useState(false);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<Partial<SupplierHubProduct>>(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await supplierHubApi.listSuppliers();
      setSuppliers(data);
    } catch (e) {
      setError(supplierHubApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const loadProducts = useCallback(async (supplierId: string) => {
    try {
      const data = await supplierHubApi.listProducts(supplierId);
      setProducts(data);
    } catch (e) {
      setError(supplierHubApiError(e));
    }
  }, []);

  const openDetail = async (supplier: SupplierHubSupplier) => {
    try {
      setSelectedSupplier(supplier);
      setView('detail');
      setError('');
      await loadProducts(supplier.id);
    } catch (e) {
      setError(supplierHubApiError(e));
    }
  };

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setView('form');
    setError('');
  };

  const openEditForm = (supplier: SupplierHubSupplier) => {
    setForm(supplier);
    setEditingId(supplier.id);
    setView('form');
    setError('');
  };

  const saveSupplier = async () => {
    try {
      if (!form.name?.trim()) {
        setError('Supplier name is required.');
        return;
      }
      if (!form.supplierType) {
        setError('Supplier type is required.');
        return;
      }
      setLoading(true);
      setError('');
      // Strip read-only fields that the backend schema doesn't accept
      const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...payload } = form as any;
      if (editingId) {
        await supplierHubApi.updateSupplier(editingId, payload);
      } else {
        await supplierHubApi.createSupplier(payload);
      }
      await loadSuppliers();
      setView('list');
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (e) {
      setError(supplierHubApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      if (!confirm('Delete this supplier and all its products?')) return;
      setError('');
      await supplierHubApi.deleteSupplier(id);
      await loadSuppliers();
      if (selectedSupplier?.id === id) {
        setSelectedSupplier(null);
        setView('list');
      }
    } catch (e) {
      setError(supplierHubApiError(e));
    }
  };

  // Product CRUD
  const saveProduct = async () => {
    try {
      if (!selectedSupplier) return;
      if (!productForm.productName?.trim()) {
        setError('Product name is required.');
        return;
      }
      setError('');
      // Strip read-only fields that the backend schema doesn't accept
      const { id: _id, supplierId: _sid, createdAt: _ca, updatedAt: _ua, ...productPayload } = productForm as any;
      if (editingProductId) {
        await supplierHubApi.updateProduct(selectedSupplier.id, editingProductId, productPayload);
      } else {
        await supplierHubApi.createProduct(selectedSupplier.id, productPayload);
      }
      await loadProducts(selectedSupplier.id);
      setShowProductForm(false);
      setProductForm(EMPTY_PRODUCT);
      setEditingProductId(null);
    } catch (e) {
      setError(supplierHubApiError(e));
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      if (!selectedSupplier) return;
      if (!confirm('Delete this product?')) return;
      setError('');
      await supplierHubApi.deleteProduct(selectedSupplier.id, productId);
      await loadProducts(selectedSupplier.id);
    } catch (e) {
      setError(supplierHubApiError(e));
    }
  };

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateProductForm = (field: string, value: any) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  // -----------------------------------------------------------------------
  // Render: List
  // -----------------------------------------------------------------------
  if (view === 'list') {
    return (
      <div className="space-y-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label-eyebrow flex items-center gap-1.5">
              <Store size={11} /> Procurement Network
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Supplier Hub</h1>
            <p className="mt-1 text-sm text-muted">
              Organize and maintain your procurement suppliers in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowIntel(!showIntel)}>
              {showIntel ? 'Hide Intelligence' : 'Intelligence'}
            </Button>
            <Button size="sm" onClick={openCreateForm}>
              <Plus size={15} /> Add Supplier
            </Button>
          </div>
        </div>

        {error && <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

        {showIntel && <SupplierHubIntelligence />}

        {loading ? (
          <Card><CardBody className="py-10 text-center text-sm text-muted">Loading suppliers…</CardBody></Card>
        ) : suppliers.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center gap-3 py-16">
              <Store size={32} className="text-muted" />
              <p className="text-sm text-muted">No suppliers yet. Add your first supplier to get started.</p>
              <Button size="sm" onClick={openCreateForm}><Plus size={15} /> Add Supplier</Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <Card key={s.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">{s.name}</h3>
                      <Badge tone="neutral" className="mt-1">
                        {SUPPLIER_TYPE_LABELS[s.supplierType] || s.supplierType}
                      </Badge>
                    </div>
                    <Badge tone={s.active ? 'success' : 'danger'}>
                      {s.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted">
                    {s.contactPerson && <div>{s.contactPerson}</div>}
                    {s.city && <div className="flex items-center gap-1.5"><MapPin size={12} /> {s.city}</div>}
                    {s.phone && <div className="flex items-center gap-1.5"><Phone size={12} /> {s.phone}</div>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    {s.reliabilityScore != null && (
                      <span className="flex items-center gap-1"><Star size={12} /> {s.reliabilityScore}/10</span>
                    )}
                    {s.creditPeriod != null && (
                      <span className="flex items-center gap-1"><Clock size={12} /> {s.creditPeriod}d credit</span>
                    )}
                  </div>
                  {s.preferredCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.preferredCategories.slice(0, 3).map((c) => (
                        <Badge key={c} tone="accent">{c}</Badge>
                      ))}
                      {s.preferredCategories.length > 3 && (
                        <Badge tone="neutral">+{s.preferredCategories.length - 3}</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => openDetail(s)}>
                      <Eye size={13} /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(s)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteSupplier(s.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Detail
  // -----------------------------------------------------------------------
  if (view === 'detail' && selectedSupplier) {
    const s = selectedSupplier;
    return (
      <div className="space-y-7">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setError(''); setView('list'); }}>
            <ArrowLeft size={15} /> Back
          </Button>
        </div>

        {error && <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Supplier info */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-semibold tracking-tight text-ink">{s.name}</h3>
                <Badge tone={s.active ? 'success' : 'danger'}>{s.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditForm(s)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteSupplier(s.id)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Supplier Type" value={SUPPLIER_TYPE_LABELS[s.supplierType] || s.supplierType} />
                <DetailField label="Business Name" value={s.businessName} />
                <DetailField label="GST Number" value={s.gstNumber} />
                <DetailField label="Contact Person" value={s.contactPerson} />
                <DetailField label="Phone" value={s.phone} icon={Phone} />
                <DetailField label="Email" value={s.email} icon={Mail} />
                <DetailField label="Address" value={s.address} />
                <DetailField label="City" value={s.city} icon={MapPin} />
                <DetailField label="State" value={s.state} />
                <DetailField label="Country" value={s.country} />
              </div>

              {s.preferredCategories.length > 0 && (
                <div>
                  <div className="label-eyebrow mb-2">Preferred Categories</div>
                  <div className="flex flex-wrap gap-2">
                    {s.preferredCategories.map((c) => <Badge key={c} tone="accent">{c}</Badge>)}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Delivery Days" value={s.deliveryDays != null ? `${s.deliveryDays} days` : undefined} icon={Clock} />
                <DetailField label="Credit Period" value={s.creditPeriod != null ? `${s.creditPeriod} days` : undefined} icon={CreditCard} />
                <DetailField label="Min Order Qty" value={s.minimumOrderQuantity != null ? String(s.minimumOrderQuantity) : undefined} />
                <DetailField label="Delivery Charges" value={s.deliveryCharges != null ? `₹${s.deliveryCharges}` : undefined} />
                <DetailField label="Payment Terms" value={s.paymentTerms} />
                <DetailField label="Reliability Score" value={s.reliabilityScore != null ? `${s.reliabilityScore}/10` : undefined} icon={Star} />
              </div>

              {s.notes && (
                <div>
                  <div className="label-eyebrow mb-1.5">Notes</div>
                  <p className="text-sm text-ink-soft">{s.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Product catalogue */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-muted" />
                <h3 className="font-display text-base font-semibold tracking-tight text-ink">Catalogue</h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setShowProductForm(true); setProductForm(EMPTY_PRODUCT); setEditingProductId(null); }}>
                <Plus size={13} /> Add
              </Button>
            </CardHeader>
            <CardBody className="space-y-3">
              {showProductForm && (
                <ProductForm
                  form={productForm}
                  onChange={updateProductForm}
                  onSave={saveProduct}
                  onCancel={() => { setShowProductForm(false); setProductForm(EMPTY_PRODUCT); setEditingProductId(null); }}
                />
              )}
              {products.length === 0 && !showProductForm ? (
                <p className="text-sm text-muted">No products in catalogue.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="rounded-md border border-line p-3 space-y-1">
                    {editingProductId === p.id ? (
                      <ProductForm
                        form={productForm}
                        onChange={updateProductForm}
                        onSave={saveProduct}
                        onCancel={() => { setEditingProductId(null); setProductForm(EMPTY_PRODUCT); }}
                      />
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium text-ink">{p.productName}</div>
                            {p.brand && <div className="text-xs text-muted">{p.brand}</div>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingProductId(p.id); setProductForm(p); }} className="text-muted hover:text-ink">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="text-muted hover:text-danger">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted">
                          {p.category && <span>{p.category}</span>}
                          {p.currentPrice != null && <span>₹{p.currentPrice}</span>}
                          {p.unit && <span>/{p.unit}</span>}
                          {p.moq != null && <span>MOQ: {p.moq}</span>}
                          {p.availability && <Badge tone={p.availability === 'In Stock' ? 'success' : 'warning'}>{p.availability}</Badge>}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Form (create/edit)
  // -----------------------------------------------------------------------
  if (view === 'form') {
    return (
      <div className="space-y-7">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setError(''); setView('list'); }}>
            <ArrowLeft size={15} /> Back
          </Button>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {editingId ? 'Edit Supplier' : 'Add Supplier'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {editingId ? 'Update supplier details.' : 'Create a new supplier in your network.'}
          </p>
        </div>

        {error && <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

        <Card>
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Supplier Name *" value={form.name || ''} onChange={(e) => updateForm('name', e.target.value)} placeholder="e.g. Fresh Farms Co." />
              <div className="space-y-1.5">
                <label className="label-eyebrow block">Supplier Type *</label>
                <select
                  value={form.supplierType || 'marketplace'}
                  onChange={(e) => updateForm('supplierType', e.target.value)}
                  className="h-11 w-full appearance-none rounded-md border border-line bg-surface px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {SUPPLIER_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <Input label="Business Name" value={form.businessName || ''} onChange={(e) => updateForm('businessName', e.target.value)} />
              <Input label="GST Number" value={form.gstNumber || ''} onChange={(e) => updateForm('gstNumber', e.target.value)} />
              <Input label="Contact Person" value={form.contactPerson || ''} onChange={(e) => updateForm('contactPerson', e.target.value)} />
              <Input label="Phone" value={form.phone || ''} onChange={(e) => updateForm('phone', e.target.value)} />
              <Input label="Email" type="email" value={form.email || ''} onChange={(e) => updateForm('email', e.target.value)} />
              <Input label="Address" value={form.address || ''} onChange={(e) => updateForm('address', e.target.value)} />
              <Input label="City" value={form.city || ''} onChange={(e) => updateForm('city', e.target.value)} />
              <Input label="State" value={form.state || ''} onChange={(e) => updateForm('state', e.target.value)} />
              <Input label="Country" value={form.country || ''} onChange={(e) => updateForm('country', e.target.value)} />
              <Input label="Delivery Days" type="number" value={form.deliveryDays ?? ''} onChange={(e) => updateForm('deliveryDays', e.target.value ? parseInt(e.target.value) : undefined)} />
              <Input label="Credit Period (days)" type="number" value={form.creditPeriod ?? ''} onChange={(e) => updateForm('creditPeriod', e.target.value ? parseInt(e.target.value) : undefined)} />
              <Input label="Min Order Quantity" type="number" value={form.minimumOrderQuantity ?? ''} onChange={(e) => updateForm('minimumOrderQuantity', e.target.value ? parseFloat(e.target.value) : undefined)} />
              <Input label="Delivery Charges (₹)" type="number" value={form.deliveryCharges ?? ''} onChange={(e) => updateForm('deliveryCharges', e.target.value ? parseFloat(e.target.value) : undefined)} />
              <Input label="Payment Terms" value={form.paymentTerms || ''} onChange={(e) => updateForm('paymentTerms', e.target.value)} placeholder="e.g. Net 30" />
              <Input label="Reliability Score (0-10)" type="number" step="0.1" value={form.reliabilityScore ?? ''} onChange={(e) => updateForm('reliabilityScore', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>

            <Input
              label="Preferred Categories (comma-separated)"
              value={(form.preferredCategories || []).join(', ')}
              onChange={(e) => updateForm('preferredCategories', e.target.value.split(',').map((c) => c.trim()).filter(Boolean))}
              placeholder="e.g. grocery, electronics"
            />

            <div className="space-y-1.5">
              <label className="label-eyebrow block">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => updateForm('notes', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={(e) => updateForm('active', e.target.checked)}
                  className="h-4 w-4 rounded border-line"
                />
                Active
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveSupplier} loading={loading}>
                {editingId ? 'Update Supplier' : 'Create Supplier'}
              </Button>
              <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function DetailField({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: LucideIcon }) {
  return (
    <div>
      <div className="label-eyebrow flex items-center gap-1">{Icon && <Icon size={11} />} {label}</div>
      <div className="mt-0.5 text-sm font-medium text-ink">{value || '—'}</div>
    </div>
  );
}

function ProductForm({
  form, onChange, onSave, onCancel,
}: {
  form: Partial<SupplierHubProduct>;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-accent/30 bg-accent-soft/30 p-3">
      <Input label="Product Name" value={form.productName || ''} onChange={(e) => onChange('productName', e.target.value)} className="h-9" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Brand" value={form.brand || ''} onChange={(e) => onChange('brand', e.target.value)} className="h-9" />
        <Input label="Category" value={form.category || ''} onChange={(e) => onChange('category', e.target.value)} className="h-9" />
        <Input label="Unit" value={form.unit || ''} onChange={(e) => onChange('unit', e.target.value)} className="h-9" placeholder="kg, pcs" />
        <Input label="Price (₹)" type="number" value={form.currentPrice ?? ''} onChange={(e) => onChange('currentPrice', e.target.value ? parseFloat(e.target.value) : undefined)} className="h-9" />
        <Input label="MOQ" type="number" value={form.moq ?? ''} onChange={(e) => onChange('moq', e.target.value ? parseFloat(e.target.value) : undefined)} className="h-9" />
        <div className="space-y-1.5">
          <label className="label-eyebrow block text-[10px]">Availability</label>
          <select
            value={form.availability || 'In Stock'}
            onChange={(e) => onChange('availability', e.target.value)}
            className="h-9 w-full appearance-none rounded-md border border-line bg-surface px-2.5 text-xs text-ink focus:border-ink focus:outline-none"
          >
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Limited">Limited</option>
          </select>
        </div>
      </div>
      <Input label="Notes" value={form.notes || ''} onChange={(e) => onChange('notes', e.target.value)} className="h-9" />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave}>Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
