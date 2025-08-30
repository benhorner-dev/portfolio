import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
	"flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "border-input flex-1",
				error: "border-destructive focus-visible:ring-destructive flex-1",
				success: "border-green-500 focus-visible:ring-green-500 flex-1",
			},
			inputSize: {
				default: "h-10 px-4 py-2",
				sm: "h-8 px-3 py-1 text-xs",
				lg: "h-12 px-6 py-3 text-base",
			},
		},
		defaultVariants: {
			variant: "default",
			inputSize: "default",
		},
	},
);

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement>,
		VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, variant, inputSize, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(inputVariants({ variant, inputSize, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input, inputVariants };
