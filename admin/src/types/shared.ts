export interface BaseResult extends Record<string, unknown> {
  id: number;
  documentId: string;
  publishedAt: string | null;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

type FormErrors<TFormValues extends FormValues = FormValues> = {
  // is it a repeatable component or dynamic zone?
  [Key in keyof TFormValues]?: TFormValues[Key] extends any[]
    ? TFormValues[Key][number] extends object
      ? FormErrors<TFormValues[Key][number]>[] | string | string[]
      : string // this would let us support errors for the dynamic zone or repeatable component not the components within.
    : TFormValues[Key] extends object // is it a regular component?
      ? FormErrors<TFormValues[Key]> // handles nested components
      : string; // otherwise its just a field or a translation message.
};

interface FormValues {
  [field: string]: any;
}

interface FormState<TFormValues extends FormValues = FormValues> {
  /**
   * TODO: make this a better type explaining errors could be nested because it follows the same
   * structure as the values.
   */
  errors: Record<string, unknown>;
  isSubmitting: boolean;
  values: TFormValues;
}

export interface FormContextValue<TFormValues extends FormValues = FormValues>
  extends FormState<TFormValues> {
  disabled: boolean;
  initialValues: TFormValues;
  modified: boolean;
  /**
   * The default behaviour is to add the row to the end of the array, if you want to add it to a
   * specific index you can pass the index.
   */
  addFieldRow: (field: string, value: any, addAtIndex?: number) => void;
  moveFieldRow: (field: string, fromIndex: number, toIndex: number) => void;
  onChange: (eventOrPath: React.ChangeEvent<any> | string, value?: any) => void;
  /*
   * The default behaviour is to remove the last row, if you want to remove a specific index you can
   * pass the index.
   */
  removeFieldRow: (field: string, removeAtIndex?: number) => void;
  resetForm: () => void;
  setErrors: (errors: FormErrors<TFormValues>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setValues: (values: TFormValues) => void;
  validate: (
    shouldSetErrors?: boolean,
    options?: Record<string, string>
  ) => Promise<
    { data: TFormValues; errors?: never } | { data?: never; errors: FormErrors<TFormValues> }
  >;
}

export type RelationSelectValue = {
  id: number;
  apiData: {
    id: number;
    documentId: string;
  };
  __temp_key__: string;
  name: string;
  label: string;
  href: string;
};
