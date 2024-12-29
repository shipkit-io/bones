import { type z } from "zod";

// Helper function to check if a field is required
export const isFormFieldRequired = (
  schema: z.ZodObject<any>,
  fieldName: string,
) => {
  const fieldSchema = schema.shape[fieldName];
  return fieldSchema.isOptional?.() === false;
};
