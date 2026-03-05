import { ProfileForm } from "@/app/(app)/(demo)/examples/forms/profile-form";
import { Separator } from "@/components/ui/separator";

export default function SettingsProfilePage() {
	return (
		<div className="space-y-6 p-sm">
			<div>
				<h3 className="text-lg font-medium">Profile</h3>
				<p className="text-sm text-muted-foreground">
					This is how others will see you on the site.
				</p>
			</div>
			<Separator />
			<ProfileForm />
		</div>
	);
}
