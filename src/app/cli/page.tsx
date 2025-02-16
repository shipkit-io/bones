import { Space_Grotesk } from 'next/font/google'
import { ComponentBrowser } from './_components/component-browser'

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-sans',
})

export default function Page() {
	return (
		<div className={`p-6 ${spaceGrotesk.className} grid place-items-center h-screen max-h-screen`}>
			<ComponentBrowser />
		</div>
	)
}

