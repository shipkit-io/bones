'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { File, Folder } from 'lucide-react'
import { useState } from 'react'

interface FileTreeProps {
	files: {
		path: string
		type: string
		content?: string
	}[]
	onFileSelect?: (file: { path: string; content?: string }) => void
	selectedFile?: string
	currentStyle?: 'brutalist' | 'modern' | 'minimalist'
}

interface TreeNode {
	name: string
	path: string
	type: 'file' | 'directory'
	content?: string
	children: Record<string, TreeNode>
}

function buildTree(files: FileTreeProps['files']): TreeNode {
	const root: TreeNode = {
		name: 'root',
		path: '',
		type: 'directory',
		children: {},
	}

	for (const file of files) {
		console.log(file)
		const parts = file?.path?.split('/') || []
		let current = root

		for (const part of parts) {
			const path = parts.slice(0, parts.indexOf(part) + 1).join('/')
			if (!current.children[part]) {
				current.children[part] = {
					name: part,
					path,
					type: part === parts[parts.length - 1] ? 'file' : 'directory',
					content: part === parts[parts.length - 1] ? file.content : undefined,
					children: {},
				}
			}
			current = current.children[part]
		}
	}

	return root
}

function TreeNode({
	node,
	onFileSelect,
	selectedFile,
	level = 0,
	currentStyle,
}: {
	node: TreeNode
	onFileSelect?: FileTreeProps['onFileSelect']
	selectedFile?: string
	level?: number
	currentStyle?: 'brutalist' | 'modern' | 'minimalist'
}) {
	const [isExpanded, setIsExpanded] = useState(true)
	const hasChildren = Object.keys(node.children).length > 0

	if (node.name === 'root') {
		return (
			<div className="space-y-1">
				{Object.values(node.children).map((child) => (
					<TreeNode
						key={child.path}
						node={child}
						onFileSelect={onFileSelect}
						selectedFile={selectedFile}
						level={level}
						currentStyle={currentStyle}
					/>
				))}
			</div>
		)
	}

	return (
		<div className="flex flex-col">
			<Button
				variant="ghost"
				size="sm"
				className={cn(
					"h-8 justify-start px-2 hover:bg-muted",
					selectedFile === node.path && "bg-muted",
					currentStyle === 'brutalist' && "rounded-none"
				)}
				style={{ paddingLeft: `${(level + 1) * 12}px` }}
				onClick={() => {
					if (node.type === 'directory') {
						setIsExpanded(!isExpanded)
					} else if (onFileSelect) {
						onFileSelect(node)
					}
				}}
			>
				<div className="flex items-center">
					{node.type === 'directory' ? (
						<>
							{isExpanded ? (
								<ChevronDownIcon className="h-4 w-4 shrink-0 mr-1 text-muted-foreground" />
							) : (
								<ChevronRightIcon className="h-4 w-4 shrink-0 mr-1 text-muted-foreground" />
							)}
							<Folder className="h-4 w-4 shrink-0 mr-1 text-muted-foreground" />
						</>
					) : (
						<File className="h-4 w-4 shrink-0 mr-1 text-muted-foreground" />
					)}
					<span className="truncate">{node.name}</span>
				</div>
			</Button>
			{hasChildren && isExpanded && (
				<div className="flex flex-col">
					{Object.values(node.children).map((child) => (
						<TreeNode
							key={child.path}
							node={child}
							onFileSelect={onFileSelect}
							selectedFile={selectedFile}
							level={level + 1}
							currentStyle={currentStyle}
						/>
					))}
				</div>
			)}
		</div>
	)
}

export function FileTree({ files, onFileSelect, selectedFile, currentStyle }: FileTreeProps) {
	const tree = buildTree(files)

	return (
		<ScrollArea className="h-[400px]">
			<TreeNode
				node={tree}
				onFileSelect={onFileSelect}
				selectedFile={selectedFile}
				currentStyle={currentStyle}
			/>
		</ScrollArea>
	)
}

