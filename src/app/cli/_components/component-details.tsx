'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BookOpen, Copy, FileJson, X } from 'lucide-react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useState } from 'react'
import { getDocumentationUrl, getInstallCommand } from '../_lib/registry-service'
import { getColor } from './colors'
import { ComponentStats } from './component-stats'
import { FileTree } from './file-tree'
import { Terminal } from './terminal'
import type { ComponentDetailsProps } from './types'

const copyToClipboard = (text: string) => {
	navigator.clipboard.writeText(text)
	toast({
		title: "Copied to clipboard",
		description: "The content has been copied to your clipboard.",
	})
}

export function ComponentDetails({
	component,
	currentStyle = 'modern',
	onClose,
	installationProgress,
	onInstall,
	onHideInstallation,
	currentRegistry
}: ComponentDetailsProps) {
	const [selectedFile, setSelectedFile] = useState<string>()

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Escape') {
			onClose()
		}
	}

	const handleCopyInstall = () => {
		const installCommand = getInstallCommand(component, currentRegistry)
		copyToClipboard(installCommand)
	}

	const handleCopyJson = () => {
		const json = JSON.stringify(component, null, 2)
		copyToClipboard(json)
	}

	const handleInstall = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		onInstall(component)
	}

	return (
		<>
			<div
				className="absolute inset-0 bg-background/50 z-40"
				onClick={onClose}
				onKeyDown={handleKeyDown}
				role="button"
				tabIndex={0}
			/>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				className={cn(
					"fixed right-4 top-4 bottom-4 w-[600px] z-50 bg-background shadow-2xl",
					currentStyle === 'brutalist'
						? 'border-2 border-primary'
						: 'border rounded-lg'
				)}
			>
				<div className="flex flex-col h-full">
					<div className="flex items-center justify-between p-4 border-b">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<div
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: getColor(component.registry || '') }}
								/>
								<h2 className="text-lg font-bold">{component.name}</h2>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className={cn(
										currentStyle === 'brutalist'
											? 'border-2 border-primary rounded-none'
											: 'border rounded-full text-xs'
									)}
								>
									{component.type === 'registry:ui' ? 'Component' : 'Block'}
								</Badge>
								{component.categories?.map((category) => (
									<Badge
										key={category}
										variant="outline"
										className={cn(
											currentStyle === 'brutalist'
												? 'border-2 border-primary rounded-none'
												: 'border rounded-full text-xs'
										)}
										style={{ backgroundColor: getColor(category), color: '#fff' }}
									>
										{category}
									</Badge>
								))}
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className={cn(
								"h-8 w-8",
								currentStyle === 'brutalist'
									? 'hover:bg-primary/20'
									: 'hover:bg-accent'
							)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="flex items-center justify-end gap-2 p-4 border-b">
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className={cn(
											"h-8 w-8",
											currentStyle === 'brutalist'
												? 'border-2 border-primary rounded-none'
												: ''
										)}
										onClick={handleCopyInstall}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Copy Install Command</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className={cn(
											"h-8 w-8",
											currentStyle === 'brutalist'
												? 'border-2 border-primary rounded-none'
												: ''
										)}
										onClick={handleCopyJson}
									>
										<FileJson className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Copy JSON</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						{getDocumentationUrl(component, currentRegistry) && (
							<Button
								variant="outline"
								size="sm"
								className={cn(
									currentStyle === 'brutalist'
										? 'border-2 border-primary rounded-none'
										: ''
								)}
								asChild
							>
								<a
									href={getDocumentationUrl(component, currentRegistry)}
									target="_blank"
									rel="noopener noreferrer"
								>
									<BookOpen className="mr-2 h-4 w-4" />
									Documentation
								</a>
							</Button>
						)}

					</div>

					<div className="flex-1 overflow-auto p-4">
						<p className="text-sm text-muted-foreground mb-4">{component.description}</p>
						<Tabs defaultValue="usage" className="flex-1 flex flex-col">
							<TabsList className={cn(
								"grid w-full grid-cols-4 text-sm font-medium",
								currentStyle === 'brutalist'
									? 'border-2 border-primary rounded-none'
									: 'border-b border-muted-foreground'
							)}>
								<TabsTrigger value="usage">Usage</TabsTrigger>
								<TabsTrigger value="code">Code</TabsTrigger>
								<TabsTrigger value="files">Files</TabsTrigger>
								<TabsTrigger value="preview">Preview</TabsTrigger>
							</TabsList>
							<div className="p-4">
								<TabsContent value="usage" className="mt-0">
									<Card>
										<CardHeader>
											<CardTitle>Usage</CardTitle>
										</CardHeader>
										<CardContent>
											<Accordion type="single" collapsible className="w-full">
												<AccordionItem value="installation">
													<AccordionTrigger>Installation</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-4">
															<div>
																<p className="mb-2">Run the following command to add this component to your project:</p>
																<pre className={cn(
																	"p-2",
																	currentStyle === 'brutalist'
																		? 'bg-muted/50 rounded-none'
																		: 'bg-primary/10 rounded-md'
																)}>
																	<code>npx shadcn@latest add {component.name}</code>
																</pre>
															</div>
															<div>
																<Button
																	type="button"
																	variant="default"
																	onClick={(e) => {
																		e.preventDefault();
																		onInstall(component);
																	}}
																	disabled={installationProgress.status === 'installing'}
																>
																	{installationProgress.status === 'installing' ? 'Installing...' : 'Install Component'}
																</Button>
																{installationProgress.message && (
																	<p className={cn(
																		"mt-2 text-sm",
																		installationProgress.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
																	)}>
																		{installationProgress.message}
																	</p>
																)}
																{installationProgress.log && (
																	<div className="mt-4">
																		<Terminal
																			output={installationProgress.log.split('\n')}
																			className="h-[200px]"
																		/>
																	</div>
																)}
															</div>
														</div>
													</AccordionContent>
												</AccordionItem>
												<AccordionItem value="dependencies">
													<AccordionTrigger>Dependencies</AccordionTrigger>
													<AccordionContent>
														{component.dependencies?.length ? (
															<ul className="list-disc pl-4">
																{component.dependencies.map(dep => (
																	<li key={dep}>{dep}</li>
																))}
															</ul>
														) : (
															<p>No dependencies</p>
														)}
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										</CardContent>
									</Card>
								</TabsContent>
								<TabsContent value="preview" className="mt-0">
									<Card>
										<CardHeader>
											<CardTitle>Preview</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-center text-muted-foreground">
												Preview coming soon...
											</div>
										</CardContent>
									</Card>
									<div className="mt-4">
										<ComponentStats component={component} currentStyle={currentStyle} />
									</div>
								</TabsContent>
								<TabsContent value="code" className="mt-0">
									<Card>
										<CardHeader>
											<CardTitle>Code</CardTitle>
										</CardHeader>
										<CardContent>
											<pre className={cn(
												"bg-muted p-4 overflow-x-auto",
												currentStyle === 'brutalist' ? 'rounded-none' : 'rounded-md'
											)}>
												<code>{JSON.stringify(component, null, 2)}</code>
											</pre>
										</CardContent>
									</Card>
								</TabsContent>
								<TabsContent value="files" className="mt-0">
									<Card>
										<CardHeader>
											<CardTitle>Files</CardTitle>
										</CardHeader>
										<CardContent>
											{component.files ? (
												<FileTree
													files={component.files.map(file => ({
														path: typeof file === 'string' ? file : file.path,
														type: 'file'
													}))}
													selectedFile={selectedFile}
													onFileSelect={(file) => setSelectedFile(file.path)}
													currentStyle={currentStyle}
												/>
											) : (
												<div className="text-center text-muted-foreground">
													No files available
												</div>
											)}
										</CardContent>
									</Card>
								</TabsContent>

							</div>
						</Tabs>
					</div>
				</div>
			</motion.div>
		</>
	)
}
