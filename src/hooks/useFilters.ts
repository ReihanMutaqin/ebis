import { useState, useMemo, useCallback } from 'react';
import type { EBISData, Filters } from '@/types';

export function useFilters(data: EBISData[]) {
  const [filters, setFilters] = useState<Filters>({
    witel: '',
    dateFrom: '',
    search: '',
    types: [],
    statuses: [],
  });

  // Extract unique values
  const uniqueWitels = useMemo(() => {
    const set = new Set<string>();
    data.forEach(r => { if (r.WITEL_OLD) set.add(r.WITEL_OLD); });
    return Array.from(set).sort();
  }, [data]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach(r => { if (r['TYPE TRANSAKSI']) set.add(r['TYPE TRANSAKSI']); });
    return Array.from(set).sort();
  }, [data]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    data.forEach(r => { if (r['STATUS RESUME']) set.add(r['STATUS RESUME']); });
    return Array.from(set).sort();
  }, [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (filters.witel) {
        if (filters.witel === 'SOUTHERN') {
          if (!['JAKSEL', 'JAKTIM', 'JAKPUS'].includes(row.WITEL_OLD || '')) return false;
        } else {
          if (row.WITEL_OLD !== filters.witel) return false;
        }
      }
      if (filters.dateFrom && row['LAST UPDATE STATUS']) {
        const datePart = row['LAST UPDATE STATUS'].substring(0, 10);
        if (datePart < filters.dateFrom) return false;
      }
      if (filters.types.length > 0 && !filters.types.includes(row['TYPE TRANSAKSI'])) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(row['STATUS RESUME'])) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const allText = JSON.stringify(Object.values(row)).toLowerCase();
        if (!allText.includes(q)) return false;
      }
      return true;
    });
  }, [data, filters]);

  const setWitel = useCallback((witel: string) => {
    setFilters(prev => ({ ...prev, witel }));
  }, []);

  const setDateFrom = useCallback((dateFrom: string) => {
    setFilters(prev => ({ ...prev, dateFrom }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const toggleType = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  const toggleStatus = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilters({
      witel: '',
      dateFrom: '',
      search: '',
      types: [],
      statuses: [],
    });
  }, []);

  const initFilters = useCallback(() => {
    setFilters({
      witel: '',
      dateFrom: '',
      search: '',
      types: [...uniqueTypes],
      statuses: [...uniqueStatuses],
    });
  }, [uniqueTypes, uniqueStatuses]);

  return {
    filters,
    filteredData,
    uniqueWitels,
    uniqueTypes,
    uniqueStatuses,
    setWitel,
    setDateFrom,
    setSearch,
    toggleType,
    toggleStatus,
    resetFilter,
    initFilters,
  };
}
