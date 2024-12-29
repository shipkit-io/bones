import Image from "next/image";

import { SignInForm } from "@/app/(app)/(authentication)/sign-in/_components/sign-in-form";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
	return (
		<Card className="overflow-hidden">
			<div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[60vh]">
				<SignInForm />

				<div className="hidden bg-muted lg:block">
					<Image
						src="https://picsum.photos/1920/1080"
						alt="Image"
						width="1920"
						height="1080"
						className="h-full w-full object-cover dark:brightness-[0.5] dark:grayscale"
						draggable={false}
					/>
				</div>
			</div>
		</Card>
	);
};
