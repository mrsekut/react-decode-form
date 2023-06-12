import * as z from 'zod';
import { FormSchema, PickExternalValues, SchemaErrors } from '../useFormForm';

/** @package */
export const mapSchemaErrors = <Schema extends FormSchema>(
  values: PickExternalValues<Schema>,
  schema: Schema,
): SchemaErrors<Schema> => {
  return Object.keys(values).reduce((acc, key) => {
    const value = values[key];
    const field = schema[key];

    if (field == null) {
      throw new Error(`schema[${key}] is not defined`);
    }

    const parseResult = field.in.safeParse(value);
    if (parseResult.success) {
      return acc;
    }

    return {
      ...acc,
      [key]: parseZodErrorPrimitive(parseResult.error),
    };
  }, {} as SchemaErrors<Schema>);
};

const parseZodErrorPrimitive = <Schema>(zodErrors: z.ZodError<Schema>) => {
  type Result = { message: string; type: string };

  const issues = zodErrors.errors;
  return issues.reduce((_, error) => {
    const { code, message } = error;

    return {
      message,
      type: code,
    };
  }, {} as Result);
};
