"use client";

import { GithubStarsButton } from "@/components/ui/github-stars-button";
import { siteConfig } from "@/config/site";
import { useEffect, useState } from "react";
import "./github-button.css";

export default function GithubButtonDemo() {
	const [stars, setStars] = useState(0);
	useEffect(() => {
		void new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
			setStars(1024);
		});
	}, []);
	return (
		<GithubStarsButton href={siteConfig.repo.url} starNumber={stars}>
			{`Star ${siteConfig.name} on GitHub`}
		</GithubStarsButton>
	);
}
