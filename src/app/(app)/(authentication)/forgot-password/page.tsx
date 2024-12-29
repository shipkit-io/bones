import { ForgotPasswordForm } from "@/app/(app)/(authentication)/forgot-password/_components/forgot-password-form";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { AuthenticationCard } from "../_components/authentication-card";

export default function ForgotPasswordPage() {
	return (
		<AuthenticationCard>
			<CardHeader>
				<CardTitle className="text-2xl">Forgot Password</CardTitle>
				<CardDescription>
					Enter your email below to reset your password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ForgotPasswordForm />
			</CardContent>
		</AuthenticationCard>
	);
}
