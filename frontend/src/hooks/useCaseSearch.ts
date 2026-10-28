import { useState, useMemo } from 'react';
import { MedicalCase } from '../types';

export function useCaseSearch(cases: MedicalCase[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState<'updated' | 'amount' | 'name'>('updated');

  const filteredCases = useMemo(() => {
    return cases
      .filter(
        c =>
          (c.name + ' ' + c.id + ' ' + c.hospital).toLowerCase().includes(searchQuery.toLowerCase()) &&
          (filterStatus === 'all' || c.stage === filterStatus)
      )
      .sort((a, b) =>
        sortOption === 'amount'
          ? b.amount - a.amount
          : sortOption === 'name'
          ? a.name.localeCompare(b.name)
          : b.updated.localeCompare(a.updated)
      );
  }, [cases, searchQuery, filterStatus, sortOption]);

  return {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortOption,
    setSortOption,
    filteredCases
  };
}
