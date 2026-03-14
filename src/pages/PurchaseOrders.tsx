import { useState } from 'react';
import { useData } from '@/context/DataContext';
import PageHeader from '@/components/erp/PageHeader';
import StatusBadge from '@/components/erp/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Eye, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { calculateOrderTotals, TAX_RATE, type POStatus } from '@/types/erp';
import type { PurchaseOrder } from '@/context/DataContext';

interface LineItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export default function PurchaseOrders() {
  const { purchaseOrders, vendors, products, addPurchaseOrder, updatePOStatus, deletePurchaseOrder, loading } = useData();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  const addLine = () => setLines(l => [...l, { product_id: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (idx: number) => setLines(l => l.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    setLines(l => l.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === 'product_id') {
        const p = products.find(x => x.id === value);
        if (p) updated.unit_price = p.unit_price;
      }
      return updated;
    }));
  };

  const totals = calculateOrderTotals(lines.filter(l => l.product_id));

  const handleCreate = async () => {
    if (!vendorId) { toast.error('Select a vendor'); return; }
    const validLines = lines.filter(l => l.product_id && l.quantity > 0);
    if (validLines.length === 0) { toast.error('Add at least one product'); return; }
    setSaving(true);
    try {
      await addPurchaseOrder({ vendor_id: vendorId, items: validLines });
      toast.success('Purchase Order created');
      setCreateOpen(false);
      setVendorId('');
      setLines([{ product_id: '', quantity: 1, unit_price: 0 }]);
    } catch {
      toast.error('Failed to create PO');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updatePOStatus(id, status);
    toast.success(`Status updated to ${status}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader title="Purchase Orders" description="Create and manage purchase orders" action={
        <Button onClick={() => setCreateOpen(true)} disabled={vendors.length === 0 || products.length === 0}>
          <Plus className="h-4 w-4 mr-2" />Create PO
        </Button>
      } />

      {vendors.length === 0 && (
        <div className="erp-card p-6 mb-4 border-warning/50 bg-warning/5">
          <p className="text-sm text-warning">Add vendors and products first before creating purchase orders.</p>
        </div>
      )}

      <div className="erp-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="erp-table-header">
              <th className="px-4 py-3 text-left">Reference</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3 text-right">Tax (5%)</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchaseOrders.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No purchase orders yet</td></tr>
            ) : purchaseOrders.map(po => (
              <tr key={po.id} className="hover:bg-muted/30 transition-colors animate-fade-in">
                <td className="px-4 py-3 font-mono text-xs font-medium">{po.reference_no}</td>
                <td className="px-4 py-3 text-foreground">{po.vendor_name}</td>
                <td className="px-4 py-3"><StatusBadge status={po.status as POStatus} /></td>
                <td className="px-4 py-3 text-right">{po.items.length}</td>
                <td className="px-4 py-3 text-right">₹{Number(po.subtotal).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">₹{Number(po.tax_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-semibold">₹{Number(po.total_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailPO(po)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Select value={po.status} onValueChange={(v) => handleStatusChange(po.id, v)}>
                      <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { await deletePurchaseOrder(po.id); toast.success('Deleted'); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create PO Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-6 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Vendor</label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Items</label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Row</Button>
              </div>
              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex items-end gap-3 p-3 rounded-lg bg-muted/30 border border-border animate-fade-in">
                    <div className="flex-1">
                      <label className="text-[10px] font-medium text-muted-foreground">Product</label>
                      <Select value={line.product_id} onValueChange={v => updateLine(idx, 'product_id', v)}>
                        <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — ₹{Number(p.unit_price).toFixed(2)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] font-medium text-muted-foreground">Qty</label>
                      <input className="erp-input w-full mt-1 h-9 text-xs" type="number" min={1} value={line.quantity} onChange={e => updateLine(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-medium text-muted-foreground">Price</label>
                      <input className="erp-input w-full mt-1 h-9 text-xs" type="number" min={0} step={0.01} value={line.unit_price} onChange={e => updateLine(idx, 'unit_price', Number(e.target.value))} />
                    </div>
                    <div className="w-24 text-right">
                      <label className="text-[10px] font-medium text-muted-foreground">Subtotal</label>
                      <p className="h-9 flex items-center justify-end text-xs font-semibold text-foreground">₹{(line.quantity * line.unit_price).toFixed(2)}</p>
                    </div>
                    {lines.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeLine(idx)}><X className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span><span className="font-medium">₹{totals.tax_amount.toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2"><span>Total</span><span className="text-primary">₹{totals.total_amount.toFixed(2)}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailPO} onOpenChange={() => setDetailPO(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detailPO?.reference_no} — Details</DialogTitle></DialogHeader>
          {detailPO && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Vendor</p><p className="font-medium">{detailPO.vendor_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={detailPO.status as POStatus} /></div>
                <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{new Date(detailPO.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Updated</p><p className="font-medium">{new Date(detailPO.updated_at).toLocaleDateString()}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                <div className="space-y-2">
                  {detailPO.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} × ₹{Number(item.unit_price).toFixed(2)}</p>
                      </div>
                      <p className="font-semibold">₹{Number(item.subtotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{Number(detailPO.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (5%)</span><span>₹{Number(detailPO.tax_amount).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-primary">₹{Number(detailPO.total_amount).toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
