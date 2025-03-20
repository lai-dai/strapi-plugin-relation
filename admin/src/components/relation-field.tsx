import React from 'react';
import {
  Filters,
  InputProps,
  unstable_useContentManagerContext as useContentManagerContext,
  useField,
  useForm,
} from '@strapi/strapi/admin';
import { styled } from 'styled-components';
import { Box, Modal, Field, Button, Checkbox, SearchForm, Searchbar } from '@strapi/design-system';

import { useIntl } from 'react-intl';
import { Plus } from '@strapi/icons';
import { BaseResult, Pagination } from '../types/shared';
import { RelationResult as RelResult } from '../types/relations';
import { CacheProvider } from '../components/cache-provider';
import { DocumentStatus } from '../components/document-status';
import { debounce } from '../utils/debounce';
import { useCallbackRef } from '../hooks/use-callback-ref';
import useFetch from '../hooks/use-fetch';
import { getRelationLabel } from '../utils/relations';
import { ChevronRight, ChevronLeft } from '@strapi/icons';
import type { Schema as SchemaUtils } from '@strapi/types';
import { generateNKeysBetween } from 'fractional-indexing';

const COLLECTION_TYPES = 'collection-types';

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
      target_input_hidden: boolean;
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

const ONE_WAY_RELATIONS = ['oneWay', 'oneToOne', 'manyToOne', 'oneToManyMorph', 'oneToOneMorph'];

export const MyInputField = (props: InputFieldProps) => {
  return (
    <CacheProvider>
      <_MyInputField {...props} />
    </CacheProvider>
  );
};

function useHandleDisconnect(fieldName: string, consumerName: string) {
  const field = useField(fieldName);
  const removeFieldRow = useForm(consumerName, (state) => state.removeFieldRow);
  const addFieldRow = useForm(consumerName, (state) => state.addFieldRow);

  const handleDisconnect: (relation: Relation) => void = (relation) => {
    if (field.value && field.value.connect) {
      /**
       * A relation will exist in the `connect` array _if_ it has
       * been added without saving. In this case, we just remove it
       * from the connect array
       */
      const indexOfRelationInConnectArray = field.value.connect.findIndex(
        (rel: NonNullable<RelationsFormValue['connect']>[number]) => rel.id === relation.id
      );

      if (indexOfRelationInConnectArray >= 0) {
        removeFieldRow(`${fieldName}.connect`, indexOfRelationInConnectArray);
        return;
      }
    }

    addFieldRow(`${fieldName}.disconnect`, {
      id: relation.id,
      apiData: {
        id: relation.id,
        documentId: relation.documentId,
        locale: relation.locale,
      },
    });
  };

  return handleDisconnect;
}

export const _MyInputField = (props: InputFieldProps) => {
  const { label, required, hint, error } = props;
  const { target_name: targetName, target_input_hidden } = props.attribute.options;

  const ctx = useContentManagerContext();
  const { formatMessage } = useIntl();
  const targetField = useField(targetName);

  const addFieldRow = useForm('RelationsList', (state) => state.addFieldRow);
  const handleDisconnect = useHandleDisconnect(targetName, 'RelationsField');

  const mainFieldRef = React.useRef(
    (ctx.layout.edit.metadatas[targetName] as { mainField: Pick<RelationsFieldProps, 'mainField'> })
      .mainField
  );
  const toOneRelationRef = React.useRef(
    ONE_WAY_RELATIONS.includes(
      (ctx.contentType?.attributes?.[targetName] as unknown as Record<string, string>)?.relationType
    )
  );

  const [relationConnects, setRelationConnect] = React.useState<RelationConnects[]>([]);

  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (target_input_hidden) {
      const inputEl = document.querySelector(`input[name="${targetName}"]`) as HTMLInputElement;

      if (inputEl) {
        const parent = inputEl.parentNode?.parentNode as HTMLDivElement;

        if (parent) {
          parent.style.display = 'none';
        }
      }
    }
  }, [target_input_hidden]);

  const { data } = useFetch({
    key: ['one-relation', toOneRelationRef.current, ctx.model, ctx.id, targetName],
    url: `/content-manager/relations/${ctx.model}/${ctx.id}/${targetName}`,
    config: {
      params: {
        pageSize: 1,
        page: 1,
      },
    },
    initialEnabled: toOneRelationRef.current,
  });

  const handleConnect: RelationsInputProps['onChange'] = React.useCallback(
    (relation) => {
      const item = {
        id: relation.id,
        apiData: {
          id: relation.id,
          documentId: relation.documentId,
          locale: relation.locale,
        },
        status: relation.status,
        /**
         * If there's a last item, that's the first key we use to generate out next one.
         */
        __temp_key__: generateNKeysBetween(null, null, 1)[0],
        // Fallback to `id` if there is no `mainField` value, which will overwrite the above `id` property with the exact same data.
        [(mainFieldRef.current ?? 'documentId') as string]:
          relation[(mainFieldRef.current ?? 'documentId') as string],
        label: getRelationLabel(relation, { name: mainFieldRef.current as string }),
        href: `../${COLLECTION_TYPES}/${ctx.model}/${relation.documentId}?${relation.locale ? `plugins[i18n][locale]=${relation.locale}` : ''}`,
      };

      if (toOneRelationRef.current) {
        targetField.value?.connect?.forEach(handleDisconnect);

        data?.results?.forEach(handleDisconnect);
      }

      addFieldRow(`${targetName}.connect`, item);

      setRelationConnect([]);
    },
    [targetName, data?.results, targetField.value]
  );

  const handleSubmit = React.useCallback(async () => {
    if (!relationConnects.length) {
      return;
    }

    relationConnects.forEach((it) => {
      handleConnect(it);
    });
  }, [relationConnects]);

  return (
    <div>
      <Field.Root hint={hint} error={error} required={required}>
        {label ? <Field.Label>{label}</Field.Label> : null}

        <Modal.Root>
          <Box paddingTop={target_input_hidden ? '12px' : undefined}>
            <Modal.Trigger>
              <Button ref={buttonRef} variant={'secondary'} style={{ height: '3.7rem' }}>
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

        <Field.Error />
        <Field.Hint />
      </Field.Root>
    </div>
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

  const toOneRelation = ONE_WAY_RELATIONS.includes(
    (ctx.contentType?.attributes?.[targetName] as unknown as Record<string, string>)?.relationType
  );

  const handleCheckedChange = React.useCallback(
    (checked: boolean, relation: BaseResult) => {
      if (toOneRelation) {
        if (checked) {
          setRelationConnect([relation]);
        } else {
          setRelationConnect([]);
        }
        return;
      }

      let result = [...relationConnects];

      if (checked) {
        result.push(relation);
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

interface EditFieldSharedProps
  extends Omit<InputProps, 'hint' | 'label' | 'type'>,
    Pick<Filters.Filter, 'mainField'> {
  hint?: string;
  label: string;
  size: number;
  unique?: boolean;
  visible?: boolean;
}

/**
 * Map over all the types in Attribute Types and use that to create a union of new types where the attribute type
 * is under the property attribute and the type is under the property type.
 */
type EditFieldLayout = {
  [K in SchemaUtils.Attribute.Kind]: EditFieldSharedProps & {
    attribute: Extract<SchemaUtils.Attribute.AnyAttribute, { type: K }>;
    type: K;
  };
}[SchemaUtils.Attribute.Kind];

interface RelationsFieldProps
  extends Omit<Extract<EditFieldLayout, { type: 'relation' }>, 'size' | 'hint'>,
    Pick<InputProps, 'hint'> {}

interface RelationsInputProps extends Omit<RelationsFieldProps, 'type'> {
  id?: string;
  model: string;
  onChange: (
    relation: Pick<RelationResult, 'documentId' | 'id' | 'locale' | 'status'> & {
      [key: string]: any;
    }
  ) => void;
}
