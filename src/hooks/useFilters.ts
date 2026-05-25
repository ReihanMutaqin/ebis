import { useState, useMemo, useCallback } from 'react';
import type { EBISData, Filters } from '@/types';
import { QUICK_MODO_TYPES, QUICK_MODO_STATUSES } from '@/types';

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
      if (filters.witel && row.WITEL_OLD !== filters.witel) return false;
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

  const quickModo = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      types: QUICK_MODO_TYPES.filter(t => uniqueTypes.includes(t)),
      statuses: QUICK_MODO_STATUSES.filter(s => uniqueStatuses.includes(s)),
    }));
  }, [uniqueTypes, uniqueStatuses]);

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
    quickModo,
    resetFilter,
    initFilters,
  };
}
