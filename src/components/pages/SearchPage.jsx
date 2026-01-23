import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  Building2,
  Landmark,
  Calendar,
  Receipt,
  TrendingUp,
  CreditCard,
  Truck,
  Package,
  TrendingDown,
  FileText,
  Calculator,
  BarChart3,
  Globe,
  ClipboardList,
  Clock,
  Zap,
  X,
  ChevronRight,
  Sparkles,
  Banknote,
  FileSpreadsheet,
} from 'lucide-react';

// Menu items (kept your original list)
const allMenuItems = [
  { icon: SearchIcon, label: 'Search', to: '/search' },
  { icon: Building2, label: 'Company', to: '/company' },
  { icon: Landmark, label: "Bank's", to: '/bank' },
  { icon: Calendar, label: 'Booking Register', to: '/booking' },
  { icon: Receipt, label: 'Bilty Register', to: '/bilty-register' },
  { icon: Landmark, label: 'Banking Register', to: '/banking-register' },
  { icon: TrendingUp, label: 'Pending Banking Register', to: '/pending-banking-register' },
  { icon: CreditCard, label: 'Create Multi Payment', to: '/create-multi-payment' },
  { icon: Receipt, label: 'Multi Payment Register', to: '/multi-paymen-register' },
  { icon: Truck, label: 'STC Truck', to: '/STC-Truck' },
  { icon: Package, label: 'STC Commodity', to: '/STC-Commodity' },
  { icon: TrendingDown, label: 'Pending Commission', to: '/pending-commission' },
  { icon: TrendingDown, label: 'Pending Difference', to: '/pending-difference' },
  { icon: TrendingDown, label: 'Pending Invoice', to: '/pending-invoice' },
  { icon: FileText, label: 'Invoice Register', to: '/invoice-register' },
  { icon: Truck, label: 'Transporters', to: '/transporters' },
  { icon: Calculator, label: 'Commission > Cash Register', to: '/cashVoucher' },
  // ... (rest of your items remain the same)
  { icon: Globe, label: 'Party & Vendor > Cash or Bank', to: '/bankPartyLedger' },
  { icon: ClipboardList, label: 'Challan Register', to: '/challan' },
];

// Popular quick actions
const popularSearches = [
  { icon: Banknote, term: 'bank', label: 'Banking' },
  { icon: Receipt, term: 'commission', label: 'Commission' },
  { icon: Calculator, term: 'payment', label: 'Payment' },
  { icon: FileText, term: 'invoice', label: 'Invoice' },
  { icon: Clock, term: 'pending', label: 'Pending' },
  { icon: FileSpreadsheet, term: 'register', label: 'Register' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(saved);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);

    if (!value.trim()) {
      setFilteredItems([]);
      setShowResults(false);
      return;
    }

    const matches = allMenuItems.filter((item) =>
      item.label.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredItems(matches);
    setShowResults(true);

    if (value.trim() && !recentSearches.includes(value.trim())) {
      const updated = [value.trim(), ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowResults(false);
    setFilteredItems([]);
    inputRef.current?.focus();
  };

  const clearRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/40 pb-20">
      <div className="mx-auto max-w-2xl px-5 pt-10 md:pt-16 lg:max-w-3xl xl:max-w-4xl">
        {/* Logo + Title area */}
        <div className="mb-10 text-center md:mb-16">
          <img
            src="/images/Trucking-logo.jpeg"
            alt="Company Logo"
            className="mx-auto h-20 w-auto rounded-2xl object-cover shadow-xl ring-1 ring-black/5"
          />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            Quick Navigation
          </h1>
          <p className="mt-2 text-slate-500">Find any register, voucher or report instantly</p>
        </div>

        {/* Search Bar – modern, elevated look */}
        <div className="relative mx-auto max-w-2xl">
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
              <SearchIcon className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search menu, registers, vouchers..."
              className={`
                w-full rounded-2xl border border-slate-200 bg-white/80 px-5 pl-12 pr-14 py-4.5 text-lg 
                shadow-lg shadow-slate-200/40 backdrop-blur-sm transition-all
                placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30
                hover:border-slate-300
              `}
            />

            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="mt-3 text-center text-xs text-slate-400">
            Press <kbd className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[0.75rem]">⌘ K</kbd> to search
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-10">
          {showResults ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-600">
                    {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
                  </span>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>

              {filteredItems.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isSub = item.label.includes(' > ');

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="group block rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/40 active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isSub ? 'bg-slate-100' : 'bg-blue-50'
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${isSub ? 'text-slate-600' : 'text-blue-600'}`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium text-slate-800 group-hover:text-blue-700">
                                {item.label}
                              </p>
                              {isSub && (
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                                  Sub
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-slate-500">{item.to}</p>
                          </div>

                          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/60 p-12 text-center shadow-sm backdrop-blur-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <SearchIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">No matches found</h3>
                  <p className="mt-2 text-slate-500">Try different keywords</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Recent */}
              {recentSearches.length > 0 && (
                <div className="mb-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4" />
                      Recent
                    </h3>
                    <button
                      onClick={clearRecents}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular */}
              <div>
                <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Zap className="h-4 w-4" />
                  Popular
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {popularSearches.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.term}
                        onClick={() => handleSearch(item.term)}
                        className={`
                          group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 
                          text-center shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md
                        `}
                      >
                        <div className="mb-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3 transition-transform group-hover:scale-110">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-800 group-hover:text-blue-700">
                          {item.label}
                        </span>
                        <span className="mt-1 text-xs text-slate-500">{item.term}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}



