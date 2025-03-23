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

const getSelectedRelationUrl = ({
  model,
  id,
  relationName,
  relationPath,
}: { model?: string; id?: string; relationName?: string; relationPath?: string } = {}) => {
  let path = relationPath || '/content-manager/relations/{MODEL}/{ID}/{RELATION_NAME}';

  if (model) {
    path = path.replace('{MODEL}', model);
  }
  if (id) {
    path = path.replace('{ID}', id);
  }
  if (relationName) {
    path = path.replace('{RELATION_NAME}', relationName);
  }

  return path;
};

const getSelectRelationUrl = ({
  model,
  relationName,
  relationPath,
}: { model?: string; relationName?: string; relationPath?: string } = {}) => {
  let path = relationPath || '/content-manager/relations/{MODEL}/{RELATION_NAME}';

  if (model) {
    path = path.replace('{MODEL}', model);
  }
  if (relationName) {
    path = path.replace('{RELATION_NAME}', relationName);
  }

  return path;
};

const getNameByRelationName = (relationName?: string): string[] | undefined => {
  if (!relationName) return undefined;
  return relationName.match(/\w+|\d+/g) as string[];
};

export { getRelationLabel, getSelectedRelationUrl, getSelectRelationUrl, getNameByRelationName };
