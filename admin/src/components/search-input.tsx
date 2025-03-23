import { SearchForm } from '@strapi/design-system';
import { useCallbackRef } from '../hooks/use-callback-ref';
import { Searchbar } from '@strapi/design-system';
import { debounce } from '../utils/debounce';
import React from 'react';
import { useIntl } from 'react-intl';

interface SearchInputProps {
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function SearchInput({ onSearchChange, search = '' }: SearchInputProps) {
  const onChangeProp = useCallbackRef(onSearchChange);

  const [value, setValue] = React.useState(search);

  const { formatMessage } = useIntl();

  const handleDebounceSearch = React.useCallback(debounce(onChangeProp, 450), []);

  const handleChange = React.useCallback((value: string) => {
    setValue(value);
    handleDebounceSearch(value);
  }, []);

  return (
    <SearchForm>
      <Searchbar
        name="searchbar"
        onClear={() => {
          handleChange('');
        }}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handleChange(e.target.value);
        }}
        placeholder={formatMessage({
          id: 'settings.search-input-placeholder',
          defaultMessage: 'Search',
        })}
      />
    </SearchForm>
  );
}
