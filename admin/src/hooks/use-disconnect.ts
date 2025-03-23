import { useField, useForm } from "@strapi/strapi/admin";
import { Relation, RelationsFormValue } from "../types/type";

export function useHandleDisconnect(fieldName: string, consumerName: string) {
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
