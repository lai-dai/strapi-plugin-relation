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

export { getRelationLabel };
