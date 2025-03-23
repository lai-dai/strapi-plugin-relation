import type { Schema as SchemaUtils } from '@strapi/types';

interface MainField {
  name: string;
  type?: SchemaUtils.Attribute.Kind | 'custom';
}
import type { RelationResult } from '../types/relations';

/**
 * @internal
 * @description Get the label of a relation, the contract has [key: string]: unknown,
 * so we need to check if the mainFieldKey is defined and if the relation has a value
 * under that property. If it does, we then verify it's type of string and return it.
 *
 * We fallback to the documentId.
 */
const getRelationLabel = (relation: RelationResult, mainField?: MainField): string => {
  const label = mainField && relation[mainField.name] ? relation[mainField.name] : null;

  if (typeof label === 'string') {
    return label;
  }

  return relation.documentId;
};

const getRelationUrl = ({
  model,
  id,
  relationName,
  relationPath,
  parentRelationName,
  parentRelationId,
  defaultPath = '/content-manager/relations/{MODEL}/{ID}/{RELATION_NAME}?filters[{PARENT_RELATION_NAME}][$eq]={PARENT_RELATION_ID}',
}: {
  model?: string;
  id?: string;
  relationName?: string;
  relationPath?: string;
  parentRelationName?: string;
  defaultPath?: string;
  parentRelationId?: string | number;
} = {}) => {
  let path = relationPath || defaultPath;

  if (model) {
    path = path.replace('{MODEL}', model);
  }
  if (id) {
    path = path.replace('{ID}', id);
  }
  if (relationName) {
    path = path.replace('{RELATION_NAME}', relationName);
  }
  if (parentRelationName) {
    path = path.replace('{PARENT_RELATION_NAME}', parentRelationName);
  }
  if (parentRelationId) {
    path = path.replace('{PARENT_RELATION_ID}', String(parentRelationId));
  }

  return path;
};

const getNameByRelationName = (relationName?: string): string[] | undefined => {
  if (!relationName) return undefined;
  return relationName.match(/\w+|\d+/g) as string[];
};

export { getRelationLabel, getNameByRelationName, getRelationUrl };
