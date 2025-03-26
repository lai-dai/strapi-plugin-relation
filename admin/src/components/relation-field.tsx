import React from 'react';
import {
  unstable_useContentManagerContext as useContentManagerContext,
  useField,
  useForm,
  useNotification,
} from '@strapi/strapi/admin';
import { styled } from 'styled-components';
import { Box, Modal, Field, Button, Checkbox } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Plus, ChevronRight, ChevronLeft } from '@strapi/icons';
import { generateNKeysBetween } from 'fractional-indexing';
import qs from 'qs';

import { CacheProvider } from '../components/cache-provider';
import { DocumentStatus } from '../components/document-status';
import { SearchInput } from '../components/search-input';

import { BaseResult, Pagination } from '../types/shared';
import { RelationFieldProps, RelationConnects, RelationResult } from '../types/type';

import { useFetch } from '../hooks/use-fetch';
import { useLazyRef } from '../hooks/use-lazy-ref';
import { useHandleDisconnect } from '../hooks/use-disconnect';

import { getNameByRelationName, getRelationUrl } from '../utils/relations';

export const ChooseRelationField = (props: RelationFieldProps) => {
  return (
    <CacheProvider>
      <RelationField {...props} />
    </CacheProvider>
  );
};

const RelationField = (props: RelationFieldProps) => {
  const ctx = useContentManagerContext();
  const model = ctx.model;

  const { formatMessage } = useIntl();

  const { data: singleTypesData, status } = useFetch({
    key: ['relation-selected', model, ctx.isSingleType],
    url: getRelationUrl({
      model,
      defaultPath: '/content-manager/single-types/{MODEL}',
    }),
    initialEnabled: ctx.isSingleType,
  });

  if (ctx.isSingleType && status === 'loading') {
    return formatMessage({
      id: 'settings.loading',
      defaultMessage: 'Loading...',
    });
  }

  const documentId = singleTypesData?.data?.documentId ?? ctx.id;

  return <_RelationField {...props} documentId={documentId} />;
};

const _RelationField = (props: RelationFieldProps & { documentId: string | number }) => {
  const { label, required, hint, error, attribute, documentId } = props;
  const {
    relation_name: relationNameProp,
    relation_hidden: relationHidden,
    relation_main_field: mainFieldProp,
    relation_type: relationType,
    selected_relation_path: selectedRelationPathProp,
    relation_component_scope: relationComponentScope,
  } = attribute.options;
  const toOneRelation = relationType === 'single';

  const ctx = useContentManagerContext();
  const fullFields = useField(''); // lấy tất cả form fields

  /** Kết xuất relation name */
  const { fullRelationName, fullRelationField, relationName } = React.useMemo(() => {
    const nameArr = getNameByRelationName(props.name) ?? [];
    const [c_relationName] = nameArr.slice(-1);

    let relationNameArr = getNameByRelationName(relationNameProp) ?? [];
    const [relationName] = relationNameArr.slice(-1);

    nameArr.forEach((key, index) => {
      if (c_relationName === key) return; // dừng lại khi ở gần cuối chuỗi

      /** không thay đổi giá trị name cuối cùng */
      if (relationNameArr[index] && relationNameArr[index] !== relationName) {
        relationNameArr[index] = key;
      }
    });

    const fullRelationName = relationNameArr.join('.');

    const fullRelationField = relationNameArr.reduce((values, key) => {
      if (key === relationName) {
        return values;
      }
      return values[key];
    }, fullFields?.value ?? {});

    return {
      relationName,
      fullRelationName,
      fullRelationField,
    };
  }, [props, fullFields?.value]);

  /** Ẩn relation input */
  React.useEffect(() => {
    if (relationHidden) {
      const relationInputEl = document.querySelector(
        `input[name="${fullRelationName}"]`
      ) as HTMLInputElement;

      if (relationInputEl) {
        const parentRelationInputEl = relationInputEl.parentNode?.parentNode as HTMLDivElement;

        if (parentRelationInputEl) {
          parentRelationInputEl.style.display = 'none';
        }
      }
    }
  }, [relationHidden]);

  const relationField = fullRelationField?.[relationName];
  const id = fullRelationField?.id
    ? fullRelationField.id
    : relationComponentScope
      ? ''
      : documentId;
  const model = ctx.model;

  const [relationPath, initParams] = selectedRelationPathProp?.split('?') ?? [];
  const initParamsRef = useLazyRef(() => {
    return initParams ? qs.parse(initParams) : {};
  });

  // dùng cho one relation
  const { data: relationSelectedData } = useFetch({
    key: ['relation-selected', relationPath, id, model, relationName, toOneRelation],
    url: getRelationUrl({
      id,
      model,
      relationName,
      relationPath,
      defaultPath: '/content-manager/relations/{MODEL}/{ID}/{RELATION_NAME}',
    }),
    config: {
      params: {
        pageSize: 1,
        page: 1,
        ...initParamsRef.current,
      },
    },
    initialEnabled: toOneRelation && !!id,
  });

  const addFieldRow = useForm('RelationsList', (state) => state.addFieldRow);
  const handleDisconnect = useHandleDisconnect(fullRelationName, 'RelationsField');

  const handleConnect = React.useCallback(
    (
      relation: Pick<RelationResult, 'documentId' | 'id' | 'locale' | 'status'> & {
        [key: string]: any;
      }
    ) => {
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
        [(mainFieldProp ?? 'documentId') as string]:
          relation[(mainFieldProp ?? 'documentId') as string],
        label: relation[mainFieldProp] ?? relation.documentId,
        href: `../collection-types/${ctx.model}/${relation.documentId}?${relation.locale ? `plugins[i18n][locale]=${relation.locale}` : ''}`,
      };

      if (toOneRelation) {
        relationField?.connect?.forEach(handleDisconnect); // xóa đã chọn từ hiện tai

        relationSelectedData?.results?.forEach(handleDisconnect); // xóa đã chọn từ server
      }

      addFieldRow(`${fullRelationName}.connect`, item); // thêm
    },
    [fullRelationName, relationSelectedData?.results, relationField?.connect, toOneRelation]
  );

  const handleSubmit = React.useCallback(
    async (relations: RelationConnects[]) => {
      if (!relations.length) {
        return;
      }

      relations.forEach((relation) => {
        handleConnect(relation);
      });
    },
    [handleConnect]
  );

  return (
    <div>
      <Field.Root hint={hint} error={error} required={required}>
        {label ? <Field.Label>{label}</Field.Label> : null}

        <Box paddingTop={relationHidden ? 2 : undefined}>
          <RelationListModal {...props} onSubmit={handleSubmit} />
        </Box>

        <Field.Error />
        <Field.Hint />
      </Field.Root>
    </div>
  );
};

function RelationListModal({
  onSubmit,
  ...props
}: RelationFieldProps & {
  onSubmit?: (relations: RelationConnects[]) => void;
  documentId: string | number;
}) {
  const { documentId } = props;
  const {
    parent_relation_name: parentRelationNameProp,
    selected_parent_relation_path: selectedParentRelationPathProp,
    parent_relation_component_scope: parentRelationComponentScope,
  } = props.attribute.options;

  const { formatMessage } = useIntl();
  const ctx = useContentManagerContext();
  const fullFields = useField(''); // lấy tất cả form fields

  const [open, setOpen] = React.useState(false);
  const [relationConnects, setRelationConnects] = React.useState<RelationConnects[]>([]);

  /** Kết xuất relation name */
  const { fullParentRelationField, parentRelationName } = React.useMemo(() => {
    const nameArr = getNameByRelationName(props.name) ?? [];
    const [c_relationName] = nameArr.slice(-1);

    let parentRelationNameArr = getNameByRelationName(parentRelationNameProp) ?? [];
    const [parentRelationName] = parentRelationNameArr.slice(-1);

    // cập nhật index nếu có
    nameArr.forEach((key, index) => {
      if (c_relationName === key) return;

      if (parentRelationNameArr[index] && parentRelationNameArr[index] !== parentRelationName) {
        parentRelationNameArr[index] = key;
      }
    });

    // const fullParentRelationName = parentRelationNameArr.join('.'); // parent không cần ghép

    const fullParentRelationField = parentRelationNameArr.reduce((values, key) => {
      if (key === parentRelationName) {
        return values;
      }
      return values[key];
    }, fullFields?.value ?? {});

    return {
      parentRelationName,
      fullParentRelationField,
    };
  }, [props, fullFields?.value]);

  const [parentRelationPath, initParams] = selectedParentRelationPathProp?.split('?') ?? [];
  const initParamsRef = useLazyRef(() => {
    return initParams ? qs.parse(initParams) : {};
  });

  const parentRelationField = fullParentRelationField?.[parentRelationName]; // giá trị hiện tại trong form
  const id = fullParentRelationField?.id
    ? fullParentRelationField.id
    : parentRelationComponentScope
      ? ''
      : documentId;
  const model = ctx.model;

  const { data: parentRelationSelectedData, status } = useFetch({
    key: [
      'parent-relation-selected',
      model,
      id,
      parentRelationPath,
      parentRelationName,
      parentRelationNameProp,
      initParamsRef.current,
    ],
    url: getRelationUrl({
      id,
      model,
      parentRelationName,
      relationPath: parentRelationPath,
      defaultPath: '/content-manager/relations/{MODEL}/{ID}/{PARENT_RELATION_NAME}',
    }),
    config: {
      params: {
        pageSize: 1,
        page: 1,
        ...initParamsRef.current,
      },
    },
    initialEnabled: !!parentRelationNameProp && !!id,
  });

  const parentRelationId = parentRelationField?.connect?.[0]?.id
    ? parentRelationField?.connect?.[0]?.id
    : parentRelationField?.disconnect?.[0]?.id
      ? undefined
      : parentRelationSelectedData?.results?.[0]?.id;

  if (status === 'pending' && !!parentRelationNameProp && !!id) {
    return formatMessage({
      id: 'settings.loading',
      defaultMessage: 'Loading...',
    });
  }

  return (
    <Modal.Root
      open={open}
      onOpenChange={(open: boolean) => {
        setOpen(open);
        if (!open) {
          setRelationConnects([]);
        }
      }}
    >
      <Modal.Trigger>
        <Button variant={'secondary'} style={{ height: '3.7rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus />

            {formatMessage({
              id: 'settings.button-choose',
              defaultMessage: 'Choose',
            })}
          </span>
        </Button>
      </Modal.Trigger>

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
          <RelationListContent
            {...props}
            relationConnects={relationConnects}
            setRelationConnect={setRelationConnects}
            parentRelationId={parentRelationId}
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
            <Button onClick={() => onSubmit?.(relationConnects)}>
              {formatMessage({
                id: 'settings.modal-button-confirm',
                defaultMessage: 'OK',
              })}
            </Button>
          </Modal.Close>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

interface RelationListProps extends RelationFieldProps {
  relationConnects: RelationConnects[];
  setRelationConnect: (value: RelationConnects[]) => void;
  parentRelationId?: number;
  documentId: string | number;
}

function RelationListContent(props: RelationListProps) {
  const { attribute, setRelationConnect, relationConnects, parentRelationId, documentId } = props;
  const {
    relation_name: relationNameProp,
    relation_main_field: mainField,
    select_relation_path: selectRelationPath,
    relation_type: relationType,
    relation_component_scope: relationComponentScope,
    parent_relation_name: parentRelationNameProp,
    select_relation_strict: selectRelationStrict,
  } = attribute.options;
  const toOneRelation = relationType === 'single';

  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const ctx = useContentManagerContext();
  const fullFields = useField(''); // lấy tất cả form fields

  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  /** Kết xuất relation name */
  const { fullRelationField, relationName, parentRelationName } = React.useMemo(() => {
    const nameArr = getNameByRelationName(props.name) ?? [];
    const [c_relationName] = nameArr.slice(-1);

    let parentRelationNameArr = getNameByRelationName(parentRelationNameProp) ?? [];
    const [parentRelationName] = parentRelationNameArr.slice(-1);

    let relationNameArr = getNameByRelationName(relationNameProp) ?? [];
    const [relationName] = relationNameArr.slice(-1);

    nameArr.forEach((key, index) => {
      if (c_relationName === key) return;

      if (relationNameArr[index] && relationNameArr[index] !== relationName) {
        relationNameArr[index] = key;
      }
    });

    // const fullRelationName = relationNameArr.join('.'); // trong list ko dùng

    const fullRelationField = relationNameArr.reduce((values, key) => {
      if (key === relationName) {
        return values;
      }
      return values[key];
    }, fullFields?.value ?? {});

    return {
      relationName,
      fullRelationField,
      parentRelationName,
    };
  }, [props, fullFields?.value]);

  const relationField = fullRelationField?.[relationName];
  const id = fullRelationField?.id
    ? fullRelationField.id
    : relationComponentScope
      ? ''
      : documentId;
  const model = ctx.model;

  const [relationPath, _initParams] = selectRelationPath?.split('?') ?? [];
  const initParams = React.useMemo(() => {
    if (!_initParams) return {};

    let str = _initParams.replace('{PARENT_RELATION_NAME}', parentRelationName);

    str = str.replace(
      '{PARENT_RELATION_ID}',
      parentRelationId ? String(parentRelationId) : 'undefined'
    );

    return qs.parse(str, {
      decoder: (str) => {
        if (str === 'undefined') return undefined;
        return str;
      },
    });
  }, [parentRelationId, _initParams, parentRelationName]);

  // Cảnh báo nếu sử dụng strict
  React.useEffect(() => {
    if (selectRelationStrict && !parentRelationId) {
      toggleNotification({
        message: formatMessage({
          id: 'settings.use-strict',
          defaultMessage: 'Please select the relationship field first',
        }),
        type: 'info',
      });
    }
  }, [parentRelationId]);

  const { data, status, error } = useFetch<{
    pagination: Pagination;
    results: BaseResult[];
  }>({
    key: [
      'relations-list',
      relationPath,
      model,
      relationName,
      id,
      page,
      search,
      initParams,
      relationField,
    ],
    url: getRelationUrl({
      relationPath,
      model,
      relationName,
      defaultPath: '/content-manager/relations/{MODEL}/{RELATION_NAME}',
    }),
    config: {
      params: {
        id,
        page,
        pageSize: 10,
        _q: search,
        idsToInclude: relationField?.disconnect?.map((rel: RelationResult) => rel.id) ?? [],
        idsToOmit: relationField?.connect?.map((rel: RelationResult) => rel.id) ?? [],
        ...initParams,
      },
    },
    cache: {
      ttl: 0,
    },
    initialEnabled: selectRelationStrict ? !!parentRelationId : true,
  });

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

      {selectRelationStrict && !parentRelationId ? (
        formatMessage({
          id: 'settings.use-strict',
          defaultMessage: 'Please select the relationship field first',
        })
      ) : status === 'pending' ? (
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
                  {relation[mainField] ?? relation.documentId}

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

export const Entry = styled.div`
  display: block;

  > div {
    display: flex;
    gap: 9px;
    align-items: start;
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
    padding-left: 9px;

    &:hover {
      background-color: #f0f0ff;
    }

    > button {
      margin-top: 13px;
    }

    > label {
      padding: 9px;
      flex-grow: 1;
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: space-between;
    }
  }
`;
