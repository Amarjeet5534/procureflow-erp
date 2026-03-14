import { useState } from 'react';
import { useData } from '@/context/DataContext';
import PageHeader from '@/components/erp/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Unknown error';
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  stock_level: number;
  description: string;
  ai_description: string;
}

const emptyForm: ProductForm = { name: '', sku: '', category: '', unit_price: 0, stock_level: 0, description: '', ai_description: '' };

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, generateAIDescription, loading } = useData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (id: string) => {
    const p = products.find(x => x.id === id);
    if (p) { setEditId(id); setForm({ name: p.name, sku: p.sku, category: p.category, unit_price: p.unit_price, stock_level: p.stock_level, description: p.description, ai_description: p.ai_description || '' }); setOpen(true); }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) { toast.error('Name and SKU are required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateProduct(editId, form);
        toast.success('Product updated');
      } else {
        await addProduct(form);
        toast.success('Product added');
      }
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to save product: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!form.name.trim()) { toast.error('Enter a product name first'); return; }
    setAiLoading(true);
    try {
      const desc = await generateAIDescription(form.name, form.category || 'General');
      setForm(f => ({ ...f, ai_description: desc }));
      toast.success('AI description generated');
    } catch (error) {
      toast.error(`Failed to generate description: ${getErrorMessage(error)}`);
    } finally {
      setAiLoading(false);
    }
  };

  const stockColor = (level: number) => level < 50 ? 'text-destructive' : level < 100 ? 'text-warning' : 'text-success';

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader title="Products" description="Manage your product catalog" action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Product</Button>} />

      <div className="erp-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="erp-table-header">
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No products yet</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors animate-fade-in">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{p.name}</p>
                  {p.ai_description && <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{p.ai_description}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{p.category}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium">${Number(p.unit_price).toFixed(2)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${stockColor(p.stock_level)}`}>{p.stock_level}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { await deleteProduct(p.id); toast.success('Deleted'); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input className="erp-input w-full mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">SKU</label>
                <input className="erp-input w-full mt-1" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <input className="erp-input w-full mt-1" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit Price</label>
                <input className="erp-input w-full mt-1" type="number" min={0} step={0.01} value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Stock Level</label>
                <input className="erp-input w-full mt-1" type="number" min={0} value={form.stock_level} onChange={e => setForm(f => ({ ...f, stock_level: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea className="erp-input w-full mt-1 min-h-[60px] resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">AI Marketing Description</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAIGenerate} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5 text-accent" />}
                  Auto-Generate
                </Button>
              </div>
              <textarea className="erp-input w-full min-h-[80px] resize-none" value={form.ai_description} onChange={e => setForm(f => ({ ...f, ai_description: e.target.value }))} placeholder="Click Auto-Generate to create an AI marketing description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
