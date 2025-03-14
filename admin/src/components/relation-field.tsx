import React from 'react';
import {
  unstable_useContentManagerContext as useContentManagerContext,
  useFetchClient,
  useField,
  useNotification,
} from '@strapi/strapi/admin';
import { Box } from '@strapi/design-system';
import { Modal } from '@strapi/design-system';
import { Field } from '@strapi/design-system';
import { Button } from '@strapi/design-system';
import { Checkbox } from '@strapi/design-system';
import { styled } from 'styled-components';
import { SearchForm } from '@strapi/design-system';
import { Searchbar } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Plus } from '@strapi/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTranslation } from '../utils/getTranslation';
import { BaseResult, Pagination } from '../types/shared';
import { RelationResult as RelResult } from '../types/relations';
import { CacheProvider } from '../components/cache-provider';
import { DocumentStatus } from '../components/document-status';
import { debounce } from '../utils/debounce';
import { useCallbackRef } from '../hooks/use-callback-ref';
import useFetch from '../hooks/use-fetch';
import { getRelationLabel } from '../utils/relations';
import { ChevronRight, ChevronLeft } from '@strapi/icons';
interface RelationResult extends RelResult {
  __temp_key__: string;
}

type RelationPosition =
  | (Pick<RelationResult, 'status' | 'locale'> & {
      before: string;
      end?: never;
    })
  | { end: boolean; before?: never; status?: never; locale?: never };

interface Relation extends Pick<RelationResult, 'documentId' | 'id' | 'locale' | 'status'> {
  href: string;
  label: string;
  position?: RelationPosition;
  __temp_key__: string;
}

interface RelationsFormValue {
  connect?: Relation[];
  disconnect?: Pick<Relation, 'id'>[];
}

interface InputFieldProps {
  attribute: {
    type: string;
    customField: string;
    options: {
      parent_name: string;
      target_name: string;
    };
  };
  disabled: false;
  label: string;
  name: string;
  placeholder: string;
  required: false;
  unique: false;
  type: string;
  hint: string;
  onChange: (e: { target: { name: string; value: string; type: string } }) => void;
  error?: unknown;
  initialValue?: string;
  value?: string;
  mainField?: unknown;
  rawError?: unknown;
  localized?: string;
}

type RelationConnects = {
  id: number;
  documentId: string;
};

export const MyInputField = (props: InputFieldProps) => {
  const { label, required, hint, error } = props;
  const { target_name: targetName } = props.attribute.options;

  const ctx = useContentManagerContext();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const location = useLocation();

  const [relationConnects, setRelationConnect] = React.useState<RelationConnects[]>([]);

  const handleSubmit = React.useCallback(async () => {
    try {
      if (relationConnects.length) {
        await put(`/content-manager/collection-types/${ctx.model}/${ctx.id}`, {
          [targetName]: {
            connect: relationConnects,
            disconnect: [],
          },
        });

        // vì hiện tại chưa thể set field relation được
        // refresh
        navigate(0);
      }
    } catch (error) {
      toggleNotification({
        message: formatMessage({
          id: getTranslation('relation.error-adding-relation'),
          defaultMessage: 'An error occurred while trying to add the relation.',
          description: (error as Error)?.message ?? '',
        }),
        type: 'danger',
      });
      console.log('🚀 error', error);
    }
  }, [relationConnects, targetName, ctx.model, ctx.id]);

  return (
    <Field.Root hint={hint} error={error} required={required}>
      {label ? <Field.Label>{label}</Field.Label> : null}

      <CacheProvider>
        <Modal.Root>
          <Box>
            <Modal.Trigger>
              <Button
                disabled={location.pathname.endsWith('/create')}
                variant={'secondary'}
                style={{ height: '3.7rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus />

                  {formatMessage({
                    id: 'settings.button-choose',
                    defaultMessage: 'Choose',
                  })}
                </span>
              </Button>
            </Modal.Trigger>
          </Box>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>
                {formatMessage({
                  id: 'settings.modal-title',
                  defaultMessage: 'Add Entry',
                })}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <ModalContent
                {...props}
                relationConnects={relationConnects}
                setRelationConnect={setRelationConnect}
              />
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close>
                <Button variant="tertiary">
                  {formatMessage({
                    id: 'settings.modal-button-close',
                    defaultMessage: 'Close',
                  })}
                </Button>
              </Modal.Close>

              <Modal.Close>
                <Button onClick={handleSubmit}>
                  {formatMessage({
                    id: 'settings.modal-button-confirm',
                    defaultMessage: 'OK',
                  })}
                </Button>
              </Modal.Close>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      </CacheProvider>

      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
};

const ModalContent = (
  props: InputFieldProps & {
    relationConnects: RelationConnects[];
    setRelationConnect: (value: RelationConnects[]) => void;
  }
) => {
  const { parent_name: parentName } = props.attribute.options;

  const ctx = useContentManagerContext();
  const { formatMessage } = useIntl();
  const parentField = useField<RelationsFormValue>(parentName);

  const {
    data: parentData,
    status,
    error,
  } = useFetch({
    key: ['relations-parent', ctx.model, ctx.id, parentName],
    url: `/content-manager/relations/${ctx.model}/${ctx.id}/${parentName}`,
    config: {
      params: {
        pageSize: 1,
        page: 1,
      },
    },
    initialEnabled: !!ctx.id,
  });

  if (status === 'pending') {
    return formatMessage({
      id: 'settings.loading',
      defaultMessage: 'Loading...',
    });
  }

  if (status === 'error') {
    return (
      error?.message ??
      formatMessage({
        id: 'settings.error',
        defaultMessage: 'Error',
      })
    );
  }

  const parentId = parentField.value?.connect?.[0]?.id ?? parentData?.results?.[0]?.id;

  return <ListCheckboxField {...props} parentId={parentId!} />;
};

function ListCheckboxField(
  props: InputFieldProps & {
    parentId: number;
    relationConnects: RelationConnects[];
    setRelationConnect: (value: RelationConnects[]) => void;
  }
) {
  const { attribute, parentId, setRelationConnect, relationConnects } = props;
  const { target_name: targetName, parent_name: parentName } = attribute.options;

  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  const { formatMessage } = useIntl();
  const ctx = useContentManagerContext();
  const targetField = useField<RelationsFormValue>(targetName);

  const mainFieldRef = React.useRef(
    (ctx.layout.edit.metadatas[targetName] as { mainField: string }).mainField
  );

  const { data, status, error } = useFetch<{
    pagination: Pagination;
    results: BaseResult[];
  }>({
    key: ['relations-target', ctx.model, targetName, search, parentId, parentName, page],
    url: `/content-manager/relations/${ctx.model}/${targetName}`,
    config: {
      params: {
        id: ctx.isSingleType ? undefined : ctx.id,
        pageSize: 10,
        _q: search,
        page: page,
        filters: {
          [parentName]: {
            $eq: parentId,
          },
        },
        idsToInclude: targetField.value?.disconnect?.map((rel) => rel.id) ?? [],
        idsToOmit: targetField.value?.connect?.map((rel) => rel.id) ?? [],
      },
    },
    cache: {
      ttl: 0,
    },
    initialEnabled: !!ctx.id,
  });

  const toOneRelation = [
    'oneWay',
    'oneToOne',
    'manyToOne',
    'oneToManyMorph',
    'oneToOneMorph',
  ].includes(
    (ctx.contentType?.attributes?.[targetName] as unknown as Record<string, string>)?.relationType
  );

  const handleCheckedChange = React.useCallback(
    (checked: boolean, relation: BaseResult) => {
      if (toOneRelation) {
        if (checked) {
          const item = {
            id: relation.id,
            documentId: relation.documentId,
          };
          setRelationConnect([item]);
        } else {
          setRelationConnect([]);
        }
        return;
      }

      let result = [...relationConnects];

      if (checked) {
        const item = {
          id: relation.id,
          documentId: relation.documentId,
        };
        result.push(item);
      } else {
        result = result.filter((it) => it.id !== relation.id);
      }

      setRelationConnect(result);
    },
    [relationConnects]
  );

  return (
    <>
      <Box
        style={{
          marginBottom: '24px',
        }}
      >
        <SearchInput search={search} onSearchChange={setSearch} />
      </Box>

      {status === 'pending' ? (
        formatMessage({
          id: 'settings.loading',
          defaultMessage: 'Loading...',
        })
      ) : status === 'error' ? (
        (error.message ??
        formatMessage({
          id: 'settings.error',
          defaultMessage: 'Error',
        }))
      ) : data?.results.length ? (
        <div>
          <div
            style={{
              display: 'grid',
              gap: '24px',
              gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            }}
          >
            {data?.results?.map((relation) => (
              <Entry key={relation.id}>
                <Checkbox
                  checked={relationConnects.some((it) => it.id === relation.id)}
                  onCheckedChange={(checked: boolean) => {
                    handleCheckedChange(checked, relation);
                  }}
                >
                  {getRelationLabel(relation, { name: mainFieldRef.current })}

                  {relation.status ? <DocumentStatus status={relation.status as string} /> : null}
                </Checkbox>
              </Entry>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              alignItems: 'center',
              marginTop: '12px',
            }}
          >
            <Button
              onClick={() => {
                setPage(page - 1);
              }}
              disabled={page <= 1}
              variant="ghost"
              style={{
                padding: '0.7rem',
              }}
            >
              <ChevronLeft />
            </Button>

            <div style={{ padding: '4px' }}>{page}</div>

            <Button
              onClick={() => {
                setPage(page + 1);
              }}
              disabled={data.pagination.page >= data.pagination.pageCount}
              variant="ghost"
              style={{
                padding: '0.7rem',
              }}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          {formatMessage({
            id: 'settings.data-empty',
            defaultMessage: 'Empty Data',
          })}
        </div>
      )}
    </>
  );
}

interface SearchInputProps {
  search?: string;
  onSearchChange?: (value: string) => void;
}

function SearchInput({ onSearchChange, search = '' }: SearchInputProps) {
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

export const Entry = styled.div`
  display: block;

  > div {
    display: flex;
    gap: 9px;
    align-items: start;
    border: 1px solid #ccc;
    padding: 9px;
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      background-color: #f0f0ff;
    }

    > button {
      margin-top: 4px;
    }

    > label {
      flex-grow: 1;
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: space-between;
    }
  }
`;
