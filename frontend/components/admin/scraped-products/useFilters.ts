'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebouncedSearch, useDebouncedValue, SEARCH_DEBOUNCE_MS } from '@/lib/hooks/useDebouncedValue';

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

export interface FilterInputs {
  search: string;
  priceMin: string;
  priceMax: string;
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
  const [searchInput, setSearchInput] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [priceMinInput, setPriceMinInput] = useState('');
  const [priceMaxInput, setPriceMaxInput] = useState('');
  const [filterFlag, setFilterFlag] = useState('');
  const filterSearch = useDebouncedSearch(searchInput, SEARCH_DEBOUNCE_MS);
  const filterPriceMin = useDebouncedValue(priceMinInput.trim(), SEARCH_DEBOUNCE_MS);
  const filterPriceMax = useDebouncedValue(priceMaxInput.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    onReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag]);

  const filters = useMemo<Filters>(
    () => ({ filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag }),
    [filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag]
  );

  const inputs: FilterInputs = { search: searchInput, priceMin: priceMinInput, priceMax: priceMaxInput };

  const handlers: FilterHandlers = {
    onSearchChange: setSearchInput,
    onSiteChange: setFilterSite,
    onBrandChange: setFilterBrand,
    onDateFromChange: setFilterDateFrom,
    onDateToChange: setFilterDateTo,
    onPriceMinChange: setPriceMinInput,
    onPriceMaxChange: setPriceMaxInput,
    onFlagChange: setFilterFlag,
    onClear: () => {
      setSearchInput('');
      setFilterSite('');
      setFilterBrand('');
      setFilterDateFrom('');
      setFilterDateTo('');
      setPriceMinInput('');
      setPriceMaxInput('');
      setFilterFlag('');
    },
  };

  return { filters, inputs, handlers };
}
