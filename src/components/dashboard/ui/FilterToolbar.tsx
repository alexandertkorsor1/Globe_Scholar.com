import React from 'react';
import { Search, SlidersHorizontal, Calendar, LayoutGrid, List } from 'lucide-react';

interface FilterToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  periodLabel?: string;
  dateRangeLabel?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  children?: React.ReactNode;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchPlaceholder = 'Search transaction',
  searchValue = '',
  onSearchChange,
  onFilterClick,
  periodLabel = 'This month',
  dateRangeLabel,
  viewMode = 'grid',
  onViewModeChange,
  children,
}) => {
  return (
    <div className="filter-toolbar">
      {/* Search Input */}
      <div style={{ position: 'relative', flex: '0 0 220px' }}>
        <input
          type="text"
          className="filter-input"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          style={{ width: '100%', paddingRight: '36px' }}
        />

        <Search
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#9ca3af',
          }}
        />
      </div>

      {/* Filter Button */}
      <button
        type="button"
        onClick={onFilterClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          color: '#374151',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        <SlidersHorizontal
          style={{ width: '14px', height: '14px' }}
        />
        Filter
      </button>

      {/* Period Dropdown */}
      <button
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          color: '#374151',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        {periodLabel}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ marginLeft: '2px' }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Date Range */}
      {dateRangeLabel && (
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            color: '#374151',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <Calendar
            style={{ width: '14px', height: '14px' }}
          />
          {dateRangeLabel}
        </button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* View Mode Toggle */}
      {onViewModeChange && (
        <div
          style={{
            display: 'flex',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            style={{
              padding: '8px 10px',
              border: 'none',
              background:
                viewMode === 'list' ? '#f3f4f6' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <List
              style={{
                width: '16px',
                height: '16px',
                color:
                  viewMode === 'list'
                    ? '#111827'
                    : '#9ca3af',
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            style={{
              padding: '8px 10px',
              border: 'none',
              borderLeft: '1px solid #e5e7eb',
              background:
                viewMode === 'grid' ? '#f3f4f6' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LayoutGrid
              style={{
                width: '16px',
                height: '16px',
                color:
                  viewMode === 'grid'
                    ? '#111827'
                    : '#9ca3af',
              }}
            />
          </button>
        </div>
      )}

      {/* Extra custom children */}
      {children}
    </div>
  );
};
