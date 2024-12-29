// Actions middleware
import { auth } from "@/server/auth";
import { type User } from "next-auth";
import { type z } from "zod";

export interface ActionState {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
}

const parseFormErrors = (errors: z.ZodError) => {
  const formErrors = Object.entries(errors.formErrors.fieldErrors).reduce(
    (acc, [key, value]) => {
      acc[key] = { message: value?.[0] ?? "" };
      return acc;
    },
    {} as Record<string, { message: string }>,
  );
  return formErrors;
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>,
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result?.success) {
      return { error: parseFormErrors(result.error) } as T;
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User,
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>,
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("User is not authenticated");
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result?.error?.errors[0]?.message } as T;
    }

    return action(result.data, formData, session.user);
  };
}

// type ActionWithTeamFunction<T> = (formData: FormData, team: TeamDataWithMembers) => Promise<T>;

// export function withTeam<T>(action: ActionWithTeamFunction<T>) {
//   return async (formData: FormData): Promise<T> => {
//     const user = await getUser();
//     if (!user) {
//       redirect("/sign-in");
//     }

//     const team = await getTeamForUser(user.id);
//     if (!team) {
//       throw new Error("Team not found");
//     }

//     return action(formData, team);
//   };
// }
