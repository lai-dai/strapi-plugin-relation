import { Filters, InputProps } from '@strapi/strapi/admin';
import { RelationResult as RelResult } from './relations';
import type { Schema as SchemaUtils } from '@strapi/types';

export interface RelationResult extends RelResult {
  __temp_key__: string;
}

export type RelationPosition =
  | (Pick<RelationResult, 'status' | 'locale'> & {
      before: string;
      end?: never;
    })
  | { end: boolean; before?: never; status?: never; locale?: never };

export interface Relation extends Pick<RelationResult, 'documentId' | 'id' | 'locale' | 'status'> {
  href: string;
  label: string;
  position?: RelationPosition;
  __temp_key__: string;
}

export interface RelationsFormValue {
  connect?: Relation[];
  disconnect?: Pick<Relation, 'id'>[];
}

export interface RelationFieldProps {
  attribute: {
    type: string;
    customField: string;
    options: {
      relation_name: string;
      relation_hidden: boolean;
      relation_main_field: string;
      relation_type: 'single' | 'multiple';

      select_relation_path: string;
      selected_relation_path: string;

      parent_relation_name: string;
      selected_parent_relation_path: string;

      relation_component_scope: boolean;
      parent_relation_component_scope: boolean;
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

export type RelationConnects = {
  id: number;
  documentId: string;
};

export interface EditFieldSharedProps
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
export type EditFieldLayout = {
  [K in SchemaUtils.Attribute.Kind]: EditFieldSharedProps & {
    attribute: Extract<SchemaUtils.Attribute.AnyAttribute, { type: K }>;
    type: K;
  };
}[SchemaUtils.Attribute.Kind];

export interface RelationsFieldProps
  extends Omit<Extract<EditFieldLayout, { type: 'relation' }>, 'size' | 'hint'>,
    Pick<InputProps, 'hint'> {}

export interface RelationsInputProps extends Omit<RelationsFieldProps, 'type'> {
  id?: string;
  model: string;
  onChange: (
    relation: Pick<RelationResult, 'documentId' | 'id' | 'locale' | 'status'> & {
      [key: string]: any;
    }
  ) => void;
}
