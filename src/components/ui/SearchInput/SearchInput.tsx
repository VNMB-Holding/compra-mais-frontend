import React from 'react';
import styles from './SearchInput.module.css';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export default function SearchInput({ onSearch, className = '', ...props }: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className={`${styles.searchWrapper} ${className}`}>
      <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
      <input
        type="text"
        className={styles.input}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}