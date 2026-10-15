import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';

interface Props {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  /** Delay before the search fires while the user is typing. */
  delayMs?: number;
}

/** Debounced search box: the URL (and the request) changes once typing pauses. */
export const SearchInput = ({ value, onSearch, placeholder = 'Search…', delayMs = 300 }: Props) => {
  const [draft, setDraft] = useState(value);

  // The URL is the source of truth: follow it when it changes from outside (back button, reset).
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = setTimeout(() => onSearch(draft), delayMs);
    return () => clearTimeout(timer);
  }, [draft, value, onSearch, delayMs]);

  return (
    <IconField iconPosition="left">
      <InputIcon className="pi pi-search" />
      <InputText
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </IconField>
  );
};
