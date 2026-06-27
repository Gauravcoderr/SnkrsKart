'use client';

import { useEffect, useMemo, useState } from 'react';

export interface Filters {
  filterSearch: string;
  filterSite: string;
  filterBrand: string;
  filterDateFrom: string;
  filterDateTo: string;
  filterPriceMin: string;
  filterPriceMax: string;
  filterFlag: string;
}

export interface FilterHandlers {
  onSearchChange: (v: string) => void;
  onSiteChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  onFlagChange: (v: string) => void;
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
  const [filterFlag, setFilterFlag] = useState('');

  useEffect(() => {
    onReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag]);

  const filters = useMemo<Filters>(
    () => ({ filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag }),
    [filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag]
  );

  const handlers: FilterHandlers = {
    onSearchChange: setFilterSearch,
    onSiteChange: setFilterSite,
    onBrandChange: setFilterBrand,
    onDateFromChange: setFilterDateFrom,
    onDateToChange: setFilterDateTo,
    onPriceMinChange: setFilterPriceMin,
    onPriceMaxChange: setFilterPriceMax,
    onFlagChange: setFilterFlag,
    onClear: () => {
      setFilterSearch('');
      setFilterSite('');
      setFilterBrand('');
      setFilterDateFrom('');
      setFilterDateTo('');
      setFilterPriceMin('');
      setFilterPriceMax('');
      setFilterFlag('');
    },
  };

  return { filters, handlers };
}
