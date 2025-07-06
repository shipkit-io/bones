'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { CheckIcon, Cross2Icon, ReloadIcon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { CopyIcon, Download } from 'lucide-react'
import { type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { installComponent } from '../_actions/install'
import { getInstalledComponents } from '../_actions/registry'
import { useRegistry } from '../_hooks/use-registry'
import { addCustomRegistry, getInstallCommand, removeCustomRegistry } from '../_lib/registry-service'
import type { Registry, RegistryItem } from '../_lib/types'
import { BrowserHeader } from './browser-header'
import { BrowserSidebar } from './browser-sidebar'
import { getColor } from './colors'
import { ComponentDetails } from './component-details'
import { buttonStyles, componentCardStyles, containerStyles } from './styles'
import { Terminal } from './terminal'
import type { InstallationProgress, StyleMode } from './types'
import { memo } from 'react'

interface ComponentCardProps {
	component: RegistryItem
	currentStyle: StyleMode
	currentRegistry?: Registry
	onOpenSidebar: (component: RegistryItem) => void
	showPreview?: boolean
	showAllVariants?: boolean
	onInstall: (component: RegistryItem) => void
	isInstalled: boolean
}

interface ActionButtonProps {
	icon: ReactNode
	tooltip: string
	onClick: (e: MouseEvent<HTMLButtonElement>) => void
	currentStyle: StyleMode
}

interface ComponentBrowserProps {
	currentStyle?: StyleMode
}

const copyToClipboard = (text: string) => {
	navigator.clipboard.writeText(text)
	toast({
		title: "Copied to clipboard",
		description: "The content has been copied to your clipboard.",
	})
}

const ActionButton = ({ icon, tooltip, onClick, currentStyle }: ActionButtonProps) => (
	<TooltipProvider delayDuration={0}>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className={buttonStyles({ style: currentStyle })}
					onClick={onClick}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)

const ComponentCard = memo(({ component, currentStyle, currentRegistry, onOpenSidebar, showPreview, onInstall, isInstalled }: ComponentCardProps) => {
	const registryColor = useMemo(() => getColor(component.registry || 'default'), [component.registry])
	const categoryColor = useMemo(() => getColor(component.categories?.[0] || 'default'), [component.categories])

	const handleCopyCommand = useCallback((e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation()
		const installCommand = getInstallCommand(component, currentRegistry)
		navigator.clipboard.writeText(installCommand)
		toast({
			title: "Copied to clipboard",
			description: "Install command has been copied to your clipboard.",
		})
	}, [component, currentRegistry])

	const handleInstallClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation()
		onInstall(component)
	}, [component, onInstall])

	return (
		<Card
			key={component.name}
			className={cn(
				componentCardStyles({ style: currentStyle }),
				'bg-card text-card-foreground relative min-h-[150px] overflow-hidden',
				isInstalled && (
					currentStyle === 'brutalist'
						? 'border-2 border-emerald-500'
						: 'border border-emerald-500/50'
				)
			)}
			onClick={() => onOpenSidebar(component)}
		>
			<div className="absolute top-0 left-0 w-0 h-0 border-8 border-transparent" style={{ borderTopColor: registryColor, borderLeftColor: registryColor }} />
			{/* <div className="absolute top-0 right-0 w-0 h-0 border-8 border-transparent" style={{ borderTopColor: categoryColor, borderRightColor: categoryColor }} /> */}
			{isInstalled && (
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="absolute bottom-0 right-0 w-0 h-0 border-8 border-transparent border-b-emerald-500 border-r-emerald-500 cursor-help" />
						</TooltipTrigger>
						<TooltipContent side="left">
							<p className="text-xs">Installed</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
			<CardHeader className="pb-2">
				<div className="flex justify-between items-start mb-2">
					<CardTitle className="text-base font-bold">{component.name}</CardTitle>
					<div className="flex items-center gap-2">
						<ActionButton
							icon={<CopyIcon className="h-4 w-4" />}
							tooltip="Copy install command"
							onClick={handleCopyCommand}
							currentStyle={currentStyle}
						/>
						{showPreview && (
							<ActionButton
								icon={<Download className="h-4 w-4" />}
								tooltip="Install component"
								onClick={handleInstallClick}
								currentStyle={currentStyle}
							/>
						)}
					</div>

				</div>
				<Badge
					variant="outline"
					className={cn(
						"mt-1 hidden md:inline-flex w-auto self-start",
						currentStyle === 'brutalist'
							? 'border-2 border-primary rounded-none'
							: 'border border-muted-foreground rounded-full text-xs'
					)}
					style={{ backgroundColor: `${categoryColor}70`, color: '#fff' }}
				>
					{component.type === 'registry:ui' ? 'Component' : 'Block'}
				</Badge>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">{component.description}</p>
			</CardContent>
		</Card>
	)
})
ComponentCard.displayName = 'ComponentCard'

export function ComponentBrowser({ currentStyle: initialStyle = 'modern' }: ComponentBrowserProps) {
	const [currentStyle, setCurrentStyle] = useState<StyleMode>(initialStyle)
	const [selectedComponent, setSelectedComponent] = useState<RegistryItem | null>(null)
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [installationProgress, setInstallationProgress] = useState<InstallationProgress>({
		status: 'idle'
	})
	const [installedComponents, setInstalledComponents] = useState<string[]>([])
	const [showInstallation, setShowInstallation] = useState(false)
	const [overwrite, setOverwrite] = useState(false)
	const sidebarRef = useRef<HTMLDivElement>(null)

	const {
		registries,
		currentRegistry,
		items,
		loading,
		error,
		filters,
		searchQuery,
		setCurrentRegistry: setCurrentRegistryBase,
		setFilters,
		setSearchQuery,
		getCategories,
		getTypes,
		setRegistries,
		filteredItems
	} = useRegistry()

	// Wrap setCurrentRegistry to handle null case
	const setCurrentRegistry = (registry: Registry | null) => {
		setCurrentRegistryBase(registry || undefined)
	}

	useEffect(() => {
		const checkInstallations = async () => {
			const components = await getInstalledComponents()
			setInstalledComponents(components)
		}
		checkInstallations()
	}, [])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
				setSelectedComponent(null)
				setIsSidebarOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside as any)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside as any)
		}
	}, [])

	const toggleStyle = useCallback(() => {
		setCurrentStyle(prev => {
			if (prev === 'brutalist') return 'modern'
			if (prev === 'modern') return 'minimalist'
			return 'brutalist'
		})
	}, [])

	const openSidebar = useCallback((component: RegistryItem) => {
		setSelectedComponent(component)
		setIsSidebarOpen(true)
	}, [])

	const closeSidebar = useCallback(() => {
		setSelectedComponent(null)
		setIsSidebarOpen(false)
		setInstallationProgress({ status: 'idle' })
	}, [])

	const handleInstall = useCallback((component: RegistryItem) => {
		// Find the registry for this component
		const registryName = component.registry
		if (!registryName) {
			toast({
				title: "Error",
				description: "Component has no registry specified",
				variant: "destructive",
			})
			return
		}

		const registry = registries.find(r => r.name === registryName)
		if (!registry) {
			toast({
				title: "Error",
				description: "Could not find registry for component",
				variant: "destructive",
			})
			return
		}

		const installCommand = getInstallCommand(component, registry)
		const componentUrl = installCommand.split('"')[1] // Extract URL from command
		if (!componentUrl) {
			toast({
				title: "Error",
				description: "Could not parse install command",
				variant: "destructive",
			})
			return
		}

		setInstallationProgress({ status: 'installing' })
		installComponent(componentUrl, { overwrite })
			.then(async (stream) => {
				let log = ''
				const reader = stream.getReader()
				while (true) {
					const { done, value } = await reader.read()
					if (done) break
					log += new TextDecoder().decode(value)
					setInstallationProgress({
						status: 'installing',
						log
					})
				}
				setInstallationProgress({
					status: 'success',
					log,
					message: 'Component installed successfully!'
				})
				const components = await getInstalledComponents()
				setInstalledComponents(components)
			})
			.catch((error) => {
				setInstallationProgress({
					status: 'error',
					message: error instanceof Error ? error.message : 'Failed to install component'
				})
			})
	}, [registries, overwrite])

	const handleCustomInstall = useCallback(async (command: string) => {
		setInstallationProgress({ status: 'installing' })

		// Extract the component URL or name from the command
		const match = command.match(/"([^"]+)"/) || command.match(/add\s+(\S+)$/)
		const componentUrl = match ? match[1] : null

		if (!componentUrl) {
			setInstallationProgress({
				status: 'error',
				message: 'Could not parse install command'
			})
			return
		}

		try {
			const stream = await installComponent(componentUrl, { overwrite })
			let log = ''
			const reader = stream.getReader()
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				log += new TextDecoder().decode(value)
				setInstallationProgress({
					status: 'installing',
					log
				})
			}
			setInstallationProgress({
				status: 'success',
				log,
				message: 'Component installed successfully!'
			})
			const components = await getInstalledComponents()
			setInstalledComponents(components)
		} catch (error) {
			setInstallationProgress({
				status: 'error',
				message: error instanceof Error ? error.message : 'Failed to install component'
			})
		}
	}, [overwrite])

	const hideInstallation = useCallback(() => {
		setInstallationProgress({ status: 'idle' })
	}, [])

	const renderComponentGrid = useCallback((registry: string) => {
		const allFilteredItems = filteredItems()
		return (
			<div className={cn(
				"p-4",
				"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto"
			)}>
				{allFilteredItems.map((component: RegistryItem) => (
					<ComponentCard
						key={component.name}
						component={component}
						currentStyle={currentStyle}
						currentRegistry={currentRegistry}
						onOpenSidebar={openSidebar}
						onInstall={handleInstall}
						isInstalled={installedComponents.includes(component.name)}
						showPreview={true}
					/>
				))}
			</div>
		)
	}, [currentStyle, currentRegistry, filteredItems, handleInstall, installedComponents, openSidebar])

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
					<p className="text-muted-foreground">{error.message}</p>
				</div>
			</div>
		)
	}

	return (
		<div className={`${containerStyles({ style: currentStyle })} bg-background text-foreground relative h-full`}>
			<BrowserHeader
				currentStyle={currentStyle}
				registries={registries}
				currentRegistry={currentRegistry}
				onRegistryChange={setCurrentRegistry}
				overwrite={overwrite}
				onOverwriteChange={setOverwrite}
				onAddRegistry={async (registry: Registry) => {
					try {
						const registryWithCustom = { ...registry, custom: true }
						await addCustomRegistry(registryWithCustom)
						setRegistries((prev: Registry[]) => [...prev, registryWithCustom])
						setCurrentRegistry(registryWithCustom)
					} catch (error) {
						toast({
							title: "Failed to add registry",
							description: error instanceof Error ? error.message : "Unknown error occurred",
							variant: "destructive",
						})
					}
				}}
				onRemoveRegistry={(name: string) => {
					try {
						removeCustomRegistry(name)
						const updatedRegistries = registries.filter((r) => r.name !== name)
						setRegistries(updatedRegistries)
						if (currentRegistry?.name === name) {
							const defaultRegistry = updatedRegistries.find(r => !r.custom) || updatedRegistries[0]
							if (defaultRegistry) {
								setCurrentRegistry(defaultRegistry)
							}
						}
					} catch (error) {
						toast({
							title: "Failed to remove registry",
							description: error instanceof Error ? error.message : "Unknown error occurred",
							variant: "destructive",
						})
					}
				}}
				onStyleChange={toggleStyle}
			/>
			<div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
				<BrowserSidebar
					currentStyle={currentStyle}
					searchTerm={searchQuery}
					setSearchTerm={setSearchQuery}
					filters={filters}
					setFilters={setFilters}
					categories={getCategories()}
					types={getTypes()}
					filteredItems={filteredItems()}
					onCustomInstall={handleCustomInstall}
					installationProgress={installationProgress}
				/>
				<div className="flex-1 overflow-auto">
					{loading ? (
						<div className="flex items-center justify-center h-full">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
						</div>
					) : (
						<div className="space-y-8">
							{renderComponentGrid('all')}
						</div>
					)}
				</div>
			</div>

			{/* Installation output overlay */}
			{(installationProgress.status !== 'idle') && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					className="fixed bottom-4 right-4 w-[500px] z-50"
				>
					<Card className="shadow-2xl border-black/10 bg-[#1E1E1E]">
						<div className="relative">
							<div className="h-8 bg-[#323233] rounded-t-lg flex items-center justify-between px-3">
								<div className="absolute left-3 flex items-center gap-2 text-xs">
									{installationProgress.status === 'installing' ? (
										<div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full">
											<ReloadIcon className="h-3 w-3 animate-spin" />
											Installing...
										</div>
									) : installationProgress.status === 'success' ? (
										<div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
											<CheckIcon className="h-3 w-3" />
											Complete
										</div>
									) : (
										<div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 text-red-400 rounded-full">
											<Cross2Icon className="h-3 w-3" />
											Error
										</div>
									)}
								</div>
								<span className="w-full text-center text-xs text-zinc-400 font-medium">
									Console Output
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-1 top-1 z-10 h-6 w-6 p-0 text-zinc-400 hover:text-zinc-300"
									onClick={hideInstallation}
									disabled={installationProgress.status === 'installing'}
								>
									<Cross2Icon className="h-4 w-4" />
								</Button>
							</div>
							<div className="pt-8">

								{installationProgress.log ? (
									<Terminal
										output={installationProgress.log.split('\n')}
										className="h-[300px] rounded-b-lg"
									/>
								) : (
									<div className="h-[300px] flex items-center justify-center text-zinc-400">
										<ReloadIcon className="h-6 w-6 animate-spin" />
									</div>
								)}
							</div>
						</div>
					</Card>
				</motion.div>
			)}

			{selectedComponent && (
				<ComponentDetails
					component={selectedComponent}
					currentStyle={currentStyle}
					currentRegistry={currentRegistry}
					onClose={closeSidebar}
					installationProgress={installationProgress}
					onInstall={handleInstall}
					onHideInstallation={hideInstallation}
				/>
			)}
		</div>
	)
}

