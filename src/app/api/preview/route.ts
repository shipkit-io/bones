import { getPayloadClient } from "@/lib/payload/payload";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug");
	const secret = searchParams.get("secret");

	// Check the secret and next parameters
	if (secret !== process.env.PAYLOAD_PUBLIC_DRAFT_SECRET) {
		return NextResponse.json({ message: "Invalid token" }, { status: 401 });
	}

	if (!slug) {
		return NextResponse.json({ message: "No slug provided" }, { status: 401 });
	}

	// Check if the page exists
	const payload = await getPayloadClient();
	const pageQuery = await payload?.find({
		collection: "pages",
		where: {
			slug: {
				equals: slug,
			},
		},
	});

	const page = pageQuery?.docs?.[0];

	if (!page) {
		return NextResponse.json({ message: "Invalid slug" }, { status: 401 });
	}

	// Enable Preview Mode by setting a cookie
	const response = NextResponse.redirect(
		new URL(`/${slug}?preview=true`, request.url),
	);
	response.cookies.set(
		"payload-token",
		process.env.PAYLOAD_PUBLIC_DRAFT_SECRET || "",
		{
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		},
	);

	return response;
}
