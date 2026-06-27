'use client';

import { useEffect, useState } from 'react';

export interface Filters {
  filterSearch: string;
  filterSite: string;
  filterBrand: string;
  filterDateFrom: string;
  filterDateTo: string;
  filterPriceMin: string;
  filterPriceMax: string;
}

export interface FilterHandlers {
  onSearchChange: (v: string) => void;
  onSiteChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  onClear: () => void;
}

export function useFilters(onReset: () => void) {
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');

  useEffect(() => {
    onReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax]);

  const filters: Filters = { filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax };

  const handlers: FilterHandlers = {
    onSearchChange: setFilterSearch,
    onSiteChange: setFilterSite,
    onBrandChange: setFilterBrand,
    onDateFromChange: setFilterDateFrom,
    onDateToChange: setFilterDateTo,
    onPriceMinChange: setFilterPriceMin,
    onPriceMaxChange: setFilterPriceMax,
    onClear: () => {
      setFilterSearch('');
      setFilterSite('');
      setFilterBrand('');
      setFilterDateFrom('');
      setFilterDateTo('');
      setFilterPriceMin('');
      setFilterPriceMax('');
    },
  };

  return { filters, handlers };
}
