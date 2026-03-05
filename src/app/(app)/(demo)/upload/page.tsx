import FileInput from "@/components/inputs/file-input";
import FileDropzone from "@/components/inputs/file-upload";

export default function UploadPage() {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<h1 className="text-2xl font-bold">Upload a File</h1>
			<FileDropzone />
			<FileInput />
		</div>
	);
}
