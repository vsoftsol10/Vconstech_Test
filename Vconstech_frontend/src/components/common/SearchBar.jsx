import { Search } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// One entry per sidebar page. `keywords` lets people find a page by related words.
const SEARCH_PAGES = [
  { label: 'Dashboard',            path: '/dashboard',                    keywords: ['home', 'overview', 'stats'] },
  { label: 'Project Management',   path: '/project',                      keywords: ['projects', 'site', 'work'] },
  { label: 'Material Management',  path: '/material',                     keywords: ['materials', 'stock', 'inventory'] },
  { label: 'Contract Management',  path: '/contract',                     keywords: ['contracts', 'agreement'] },
  { label: 'Financial Management', path: '/financial',                    keywords: ['finance', 'money', 'payments', 'expenses'] },
  { label: 'Billing',              path: '/financial-management/billing', keywords: ['bill', 'invoice', 'invoices'] },
  { label: 'File Management',      path: '/file-managememt',              keywords: ['files', 'documents', 'upload'] },
  { label: 'Labour Management',    path: '/labor-managememt',             keywords: ['labor', 'workers', 'attendance'] },
  { label: 'Add Engineers',        path: '/add-engineers',                keywords: ['engineer', 'members', 'team', 'staff', 'employees'] },
  { label: 'Profile',              path: '/profile',                      keywords: ['account', 'settings', 'company', 'logo'] },
];

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Starts-with matches come first, then "contains" matches.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const scored = [];
    SEARCH_PAGES.forEach((page) => {
      const label = page.label.toLowerCase();
      const words = [label, ...label.split(' '), ...page.keywords];

      if (words.some((w) => w.startsWith(q))) scored.push({ page, score: 0 });
      else if (words.some((w) => w.includes(q))) scored.push({ page, score: 1 });
    });

    return scored.sort((a, b) => a.score - b.score).map((s) => s.page);
  }, [query]);

  const goTo = (page) => {
    navigate(page.path);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) goTo(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Ctrl+K / Cmd+K focuses the search box
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-100 transition">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, materials, members..."
          className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          aria-label="Search pages"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        <kbd className="hidden lg:inline text-[11px] text-gray-400 border border-gray-200 rounded-md px-1.5 py-0.5 bg-white">
          Ctrl + K
        </kbd>
      </div>

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-72 overflow-y-auto py-1"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">No pages match "{query}"</li>
          ) : (
            results.map((page, i) => (
              <li
                key={page.path}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); goTo(page); }}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer text-sm ${
                  i === activeIndex ? 'bg-yellow-50 text-gray-900' : 'text-gray-700'
                }`}
              >
                <span className="font-medium truncate">{page.label}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{page.path}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;