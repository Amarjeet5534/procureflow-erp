import { useState } from 'react';
import { useData } from '@/context/DataContext';
import PageHeader from '@/components/erp/PageHeader';
import StarRating from '@/components/erp/StarRating';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Mail, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Unknown error';
}

interface VendorForm {
  name: string;
  contact_email: string;
  contact_phone: string;
  rating: number;
  address: string;
}

const emptyForm: VendorForm = { name: '', contact_email: '', contact_phone: '', rating: 3, address: '' };

export default function Vendors() {
  const { vendors, addVendor, updateVendor, deleteVendor, loading } = useData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (id: string) => {
    const v = vendors.find(x => x.id === id);
    if (v) { setEditId(id); setForm({ name: v.name, contact_email: v.contact_email, contact_phone: v.contact_phone, rating: v.rating, address: v.address }); setOpen(true); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vendor name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateVendor(editId, form);
        toast.success('Vendor updated');
      } else {
        await addVendor(form);
        toast.success('Vendor added');
      }
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to save vendor: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVendor(id);
      toast.success('Vendor deleted');
    } catch (error) {
      toast.error(`Cannot delete vendor: ${getErrorMessage(error)}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader title="Vendors" description="Manage your supplier network" action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Vendor</Button>} />

      {vendors.length === 0 ? (
        <div className="erp-card p-12 text-center">
          <p className="text-muted-foreground">No vendors yet. Add your first vendor to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="erp-card p-5 animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{v.name}</h3>
                  <StarRating rating={v.rating} />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{v.contact_email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{v.contact_phone}</div>
                <p className="pt-1">{v.address}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input className="erp-input w-full mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input className="erp-input w-full mt-1" type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <input className="erp-input w-full mt-1" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Rating (1-5)</label>
              <input className="erp-input w-full mt-1" type="number" min={1} max={5} step={0.1} value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <input className="erp-input w-full mt-1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
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
