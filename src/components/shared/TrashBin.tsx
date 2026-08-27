import React, { useEffect, useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { Trash2, RefreshCw, Undo, AlertCircle } from 'lucide-react';
import { TrashItem } from '../../types/database';

interface TrashBinProps {
  departmentKey: string;
}

export const TrashBin: React.FC<TrashBinProps> = ({ departmentKey }) => {
  const { fetchTrashItems, restoreTrashItem, deleteTrashItemPermanently } = useApplication();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTrash = async () => {
    try {
      setLoading(true);
      setError(null);
      const trash = await fetchTrashItems(departmentKey);
      setItems(trash);
    } catch (err) {
      console.error('Failed to load trash:', err);
      setError('Could not retrieve trash records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, [departmentKey]);

  const handleRestore = async (type: string, id: string) => {
    if (actioningId) return;
    try {
      setActioningId(id);
      setError(null);
      await restoreTrashItem(type, id);
      await loadTrash();
    } catch (err) {
      console.error('Failed to restore item:', err);
      setError('Failed to restore the selected item.');
    } finally {
      setActioningId(null);
    }
  };

  const handlePermanentDelete = async (type: string, id: string) => {
    if (actioningId) return;
    if (!confirm('Are you absolutely sure you want to permanently delete this record? This action cannot be undone.')) {
      return;
    }
    try {
      setActioningId(id);
      setError(null);
      await deleteTrashItemPermanently(type, id);
      await loadTrash();
    } catch (err) {
      console.error('Failed to permanently delete item:', err);
      setError('Failed to permanently delete the selected item.');
    } finally {
      setActioningId(null);
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt);
    const expiryDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const remainingTime = expiryDate.getTime() - Date.now();
    const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
    return remainingDays > 0 ? remainingDays : 0;
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 style={{ color: '#ef4444', width: '20px', height: '20px' }} />
            <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Department Recycle Bin (Trash)</h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>
            Soft-deleted records spend 30 days in this bin before getting permanently purged automatically.
          </p>
        </div>
        <button
          onClick={loadTrash}
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px' }}
          title="Refresh trash"
          disabled={loading}
        >
          <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '14px' }}>
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1.5s linear infinite', marginBottom: '8px' }} />
          <div style={{ fontSize: '0.8rem' }}>Loading deleted files & records...</div>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <Trash2 style={{ width: '32px', height: '32px', color: '#475569', marginBottom: '8px' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Recycle Bin is Empty</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>No records have been deleted in this department recently.</div>
        </div>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Record / File Name</th>
                <th>Record Type</th>
                <th>Deleted Date</th>
                <th>Auto-Purge In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const daysLeft = getDaysRemaining(item.deleted_at);
                const isCritical = daysLeft <= 5;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.display_name}</td>
                    <td>
                      <span className="badge badge-submitted" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(item.deleted_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: isCritical ? '#f87171' : '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isCritical && <AlertCircle style={{ width: '12px', height: '12px' }} />}
                        {daysLeft} days remaining
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRestore(item.type, item.id)}
                          disabled={actioningId === item.id}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.05)'
                          }}
                        >
                          <Undo style={{ width: '12px', height: '12px' }} />
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.type, item.id)}
                          disabled={actioningId === item.id}
                          className="btn btn-danger btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171'
                          }}
                        >
                          <Trash2 style={{ width: '12px', height: '12px' }} />
                          Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
