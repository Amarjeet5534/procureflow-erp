import { useData } from '@/context/DataContext';
import PageHeader from '@/components/erp/PageHeader';
import StatusBadge from '@/components/erp/StatusBadge';
import { FileText, Users, Package, IndianRupee, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { POStatus } from '@/types/erp';

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="erp-stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-2 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { purchaseOrders, vendors, products, loading } = useData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalValue = purchaseOrders.reduce((s, po) => s + Number(po.total_amount), 0);
  const pendingCount = purchaseOrders.filter(po => po.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock_level < 100);
  const recentOrders = [...purchaseOrders].slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your procurement operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Orders" value={purchaseOrders.length} sub={`${pendingCount} pending`} color="bg-primary/10 text-primary" />
        <StatCard icon={IndianRupee} label="Total Value" value={`₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} sub="Across all POs" color="bg-success/10 text-success" />
        <StatCard icon={Users} label="Active Vendors" value={vendors.length} sub="Registered suppliers" color="bg-accent/10 text-accent" />
        <StatCard icon={Package} label="Products" value={products.length} sub={`${lowStockProducts.length} low stock`} color="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 erp-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Purchase Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="erp-table-header">
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No purchase orders yet</td></tr>
                ) : recentOrders.map(po => (
                  <tr key={po.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate('/purchase-orders')}>
                    <td className="px-4 py-3 font-mono text-xs font-medium">{po.reference_no}</td>
                    <td className="px-4 py-3 text-foreground">{po.vendor_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={po.status as POStatus} /></td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(po.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="erp-card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Low Stock Alerts</h2>
          </div>
          <div className="p-2">
            {lowStockProducts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">All stock levels are healthy</p>
            ) : lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                </div>
                <span className="text-sm font-semibold text-destructive">{p.stock_level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
