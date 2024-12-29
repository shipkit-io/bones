import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { signIn } from "@/server/auth";

export const SignUpWithGithub = () => {
  return (
    <>
      <form
        action={() => {
          "use server";
          void signIn("github", { redirectTo: routes.home ?? "/" });
        }}
      >
        <Button type="submit" variant="outline" className="w-full">
          Sign up with GitHub
        </Button>
      </form>
    </>
  );
};
