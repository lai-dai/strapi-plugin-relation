import React from 'react';
import { useCache } from '../components/cache-provider';
import { FetchOptions, useFetchClient, useNotification } from '@strapi/strapi/admin';
import { getTranslation } from '../utils/getTranslation';
import { useIntl } from 'react-intl';

type CustomAxiosConfig = {
  key: Array<unknown>;
  initialEnabled?: boolean;
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
  url: string;
  config?: FetchOptions;
};

export function keyify(key: CustomAxiosConfig['key']) {
  return key.map((item) => JSON.stringify(item)).join('-');
}

export default function useFetch<T = any>({
  key,
  initialEnabled = true,
  cache = { enabled: true, ttl: 60 },
  url,
  config,
}: CustomAxiosConfig) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState<T | undefined>();
  const [error, setError] = React.useState<any>();
  const [status, setStatus] = React.useState<'loading' | 'pending' | 'success' | 'error'>(
    'pending'
  );

  const { getCache, setCache, deleteCache } = useCache();

  const { get } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();

  const refetch = (hard: boolean = false) => {
    setIsLoading(true);
    setError(undefined);
    if (status !== 'pending') {
      setStatus('loading');
    }
    const cacheKey = keyify(key);
    if (cache?.enabled && getCache(cacheKey) !== undefined && !hard) {
      setData(getCache(cacheKey));
      setIsLoading(false);
      setError(undefined);
      setStatus('success');
      return;
    }
    get(url, config)
      .then((data) => {
        setStatus('success');
        setData(data?.data ?? (data as T));
        if (cache?.enabled) setCache(cacheKey, data?.data ?? data, cache.ttl);
      })
      .catch((err) => {
        setStatus('error');
        setError(err);
        toggleNotification({
          message: formatMessage({
            id: getTranslation('relation.error-adding-relation'),
            defaultMessage: 'An error occurred while trying to add the relation.',
          }),
          type: 'danger',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  function inValidate(invalidationKey: CustomAxiosConfig['key']) {
    deleteCache(keyify(invalidationKey));
  }

  React.useEffect(() => {
    if (initialEnabled) refetch();
  }, key);

  return { isLoading, data, error, refetch, inValidate, status } as const;
}
