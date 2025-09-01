import type { Meta, StoryObj } from "@storybook/react";
import { Background } from "@/components/atoms/background";

const meta: Meta<typeof Background> = {
	title: "Atoms/Background",
	component: Background,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A background component that creates a cyberpunk aesthetic with layered visual elements including a base background, grid overlay, and colored blur effects.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="relative w-full h-screen">
			<Background />
			<div className="relative z-10 flex items-center justify-center h-full text-foreground">
				<div className="text-center">
					<h1 className="text-6xl font-bold mb-6">Cyberpunk Background</h1>
					<p className="text-xl opacity-80">
						This demonstrates the full-screen background effect
					</p>
				</div>
			</div>
		</div>
	),
};

export const InContainer: Story = {
	render: () => (
		<div className="max-w-4xl mx-auto p-8">
			<div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
				<Background />
				<div className="relative z-10 flex items-center justify-center h-full text-foreground">
					<div className="text-center">
						<h2 className="text-3xl font-bold mb-4">Contained Background</h2>
						<p className="text-lg opacity-80">
							Background within a contained layout
						</p>
					</div>
				</div>
			</div>
		</div>
	),
};

export const WithContent: Story = {
	render: () => (
		<div className="relative w-full h-screen">
			<Background />
			<div className="relative z-10 p-8">
				<header className="mb-8">
					<h1 className="text-4xl font-bold mb-2">Portfolio</h1>
					<p className="text-lg opacity-80">
						Welcome to my cyberpunk portfolio
					</p>
				</header>
				<main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }, (_, i) => ({
						id: `project-${i + 1}`,
						number: i + 1,
					})).map((project) => (
						<div
							key={project.id}
							className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-6"
						>
							<h3 className="text-xl font-semibold mb-2">
								Project {project.number}
							</h3>
							<p className="opacity-80">
								This is a sample project card that demonstrates content over the
								background.
							</p>
						</div>
					))}
				</main>
			</div>
		</div>
	),
};

export const Minimal: Story = {
	render: () => (
		<div className="relative w-full h-64">
			<Background />
			<div className="relative z-10 flex items-center justify-center h-full">
				<span className="text-foreground text-lg">Minimal example</span>
			</div>
		</div>
	),
};
