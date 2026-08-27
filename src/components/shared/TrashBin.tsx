import React, { useEffect, useState, useMemo } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { Trash2, RefreshCw, Undo, AlertCircle, Search, CheckCircle, ShieldAlert, X, Filter, Sparkles, FolderArchive, ArrowRight } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Interactive Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation Modal
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState<TrashItem | null>(null);
  const [bulkAction, setBulkAction] = useState<'restore_all' | 'empty_bin' | null>(null);

  const loadTrash = async () => {
    try {
      setLoading(true);
      setError(null);
      const trash = await fetchTrashItems(departmentKey);
      setItems(trash);
    } catch (err) {
      console.error('Failed to load trash:', err);
      setError('Could not retrieve deleted records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, [departmentKey]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const handleRestore = async (type: string, id: string, name: string) => {
    if (actioningId) return;
    try {
      setActioningId(id);
      setError(null);
      await restoreTrashItem(type, id);
      setSuccessMessage(`✅ Restored "${name}" successfully! Record is active in database.`);
      await loadTrash();
    } catch (err) {
      console.error('Failed to restore item:', err);
      setError('Failed to restore the selected item.');
    } finally {
      setActioningId(null);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!pendingPermanentDelete) return;
    const { type, id, display_name } = pendingPermanentDelete;
    try {
      setActioningId(id);
      setError(null);
      await deleteTrashItemPermanently(type, id);
      setPendingPermanentDelete(null);
      setSuccessMessage(`🗑️ Permanently removed "${display_name}" from database.`);
      await loadTrash();
    } catch (err) {
      console.error('Failed to permanently delete item:', err);
      setError('Failed to permanently delete the selected item.');
    } finally {
      setActioningId(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      if (bulkAction === 'restore_all') {
        for (const item of items) {
          await restoreTrashItem(item.type, item.id);
        }
        setSuccessMessage(`✅ Successfully restored all ${items.length} records back to active database!`);
      } else if (bulkAction === 'empty_bin') {
        for (const item of items) {
          await deleteTrashItemPermanently(item.type, item.id);
        }
        setSuccessMessage(`🗑️ Recycle Bin emptied. ${items.length} records purged permanently.`);
      }
      setBulkAction(null);
      await loadTrash();
    } catch (err) {
      console.error('Bulk action failed:', err);
      setError('Bulk operation encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt);
    const expiryDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const remainingTime = expiryDate.getTime() - Date.now();
    const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
    return remainingDays > 0 ? remainingDays : 0;
  };

  const categories = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    items.forEach(i => {
      map[i.type] = (map[i.type] || 0) + 1;
    });
    return map;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = activeCategory === 'all' || item.type === activeCategory;
      const matchSearch = searchTerm === '' ||
        item.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [items, activeCategory, searchTerm]);

  const getItemBadgeStyle = (type: string) => {
    switch (type) {
      case 'application':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'partner':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'course':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'scholarship':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'brochure':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' };
      case 'marketing_post':
        return { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' };
      case 'employee':
        return { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 style={{ color: '#ef4444', width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                Interactive Database Recycle Bin
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Soft-deleted applications, courses, partner schools, and marketing items stay here for 30 days. You can restore or permanently delete them at any time.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {items.length > 0 && (
            <>
              <button
                onClick={() => setBulkAction('restore_all')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.74rem', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}
                title="Restore all items in recycle bin"
              >
                <Undo size={13} />
                Restore All ({items.length})
              </button>
              <button
                onClick={() => setBulkAction('empty_bin')}
                disabled={loading}
                className="btn btn-danger btn-sm"
                style={{ fontSize: '0.74rem' }}
                title="Permanently empty recycle bin"
              >
                <Trash2 size={13} />
                Empty Bin
              </button>
            </>
          )}

          <button
            onClick={loadTrash}
            className="btn btn-secondary btn-sm"
            style={{ padding: '7px' }}
            title="Refresh database records"
            disabled={loading}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#6ee7b7', fontSize: '0.8rem', marginBottom: '14px' }}>
          <CheckCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '14px' }}>
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              fontSize: '0.72rem',
              padding: '4px 10px',
              borderRadius: '20px',
              border: activeCategory === 'all' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
              background: activeCategory === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === 'all' ? '#93c5fd' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            All Items ({items.length})
          </button>

          {Object.keys(categories).filter(c => c !== 'all').map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: '20px',
                border: activeCategory === cat ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                background: activeCategory === cat ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                color: activeCategory === cat ? '#d8b4fe' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                textTransform: 'capitalize'
              }}
            >
              {cat.replace(/_/g, ' ')} ({categories[cat]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1', maxWidth: '320px' }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search deleted records..."
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.76rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1.5s linear infinite', marginBottom: '8px' }} />
          <div style={{ fontSize: '0.8rem' }}>Loading recycle bin items...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <FolderArchive style={{ width: '36px', height: '36px', color: '#475569', marginBottom: '8px' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            {searchTerm || activeCategory !== 'all' ? 'No Matching Records Found' : 'Recycle Bin is Empty'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            {searchTerm || activeCategory !== 'all' ? 'Try clearing filters or search term.' : 'Deleted items from this department will appear here interactively.'}
          </div>
        </div>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Record Details</th>
                <th>Category</th>
                <th>Deleted Date</th>
                <th>Auto-Purge In</th>
                <th style={{ textAlign: 'right' }}>Interactive Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const daysLeft = getDaysRemaining(item.deleted_at);
                const isCritical = daysLeft <= 5;
                const badge = getItemBadgeStyle(item.type);

                return (
                  <tr key={item.id} style={{ transition: 'background 0.2s' }}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isCritical ? '#ef4444' : '#3b82f6' }} />
                        <span>{item.display_name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.text,
                          border: badge.border,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: isCritical ? '#f87171' : '#fbbf24',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isCritical && <AlertCircle style={{ width: '12px', height: '12px' }} />}
                        {daysLeft} days remaining
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRestore(item.type, item.id, item.display_name)}
                          disabled={actioningId === item.id}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.08)'
                          }}
                          title="Restore back to active database"
                        >
                          <Undo style={{ width: '12px', height: '12px' }} />
                          {actioningId === item.id ? 'Restoring...' : 'Restore'}
                        </button>
                        <button
                          onClick={() => setPendingPermanentDelete(item)}
                          disabled={actioningId === item.id}
                          className="btn btn-danger btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#f87171'
                          }}
                          title="Permanently remove from database"
                        >
                          <Trash2 style={{ width: '12px', height: '12px' }} />
                          Purge
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

      {/* Confirmation Modal for Permanent Delete */}
      {pendingPermanentDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '440px', padding: '24px', background: '#0f172a', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                  Permanently Delete Record?
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  This action is irreversible and purges the row from the database.
                </span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Target Item:</div>
              <strong style={{ fontSize: '0.84rem', color: '#fff', display: 'block' }}>
                {pendingPermanentDelete.display_name}
              </strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Type: {pendingPermanentDelete.type.toUpperCase()} • Table: {pendingPermanentDelete.original_table}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPendingPermanentDelete(null)}
                className="btn btn-secondary btn-sm"
                disabled={actioningId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPermanentDelete}
                className="btn btn-danger btn-sm"
                disabled={actioningId !== null}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={13} />
                {actioningId ? 'Purging...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Actions */}
      {bulkAction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '440px', padding: '24px', background: '#0f172a', borderRadius: '14px', border: bulkAction === 'empty_bin' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: bulkAction === 'empty_bin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bulkAction === 'empty_bin' ? '#ef4444' : '#10b981' }}>
                {bulkAction === 'empty_bin' ? <ShieldAlert size={20} /> : <Sparkles size={20} />}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                  {bulkAction === 'empty_bin' ? 'Empty Entire Recycle Bin?' : 'Restore All Records?'}
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {bulkAction === 'empty_bin'
                    ? `This will permanently purge all ${items.length} records.`
                    : `This will reactivate all ${items.length} records in the system.`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setBulkAction(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAction}
                className={bulkAction === 'empty_bin' ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {bulkAction === 'empty_bin' ? <Trash2 size={13} /> : <Undo size={13} />}
                {bulkAction === 'empty_bin' ? 'Empty Bin' : 'Restore All'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

