import * as React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
		size?: "default" | "sm" | "lg" | "icon";
	}
>(({ className, variant = "default", size = "default", ...props }, ref) => {
	return (
		<button
			ref={ref}
			className={cn(
				"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
				{
					"bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-black/5":
						variant === "default",
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm shadow-black/5":
						variant === "outline",
					"hover:bg-accent hover:text-accent-foreground": variant === "ghost",
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-black/5":
						variant === "destructive",
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm shadow-black/5":
						variant === "secondary",
					"h-9 px-4 py-2": size === "default",
					"h-8 rounded-md px-3": size === "sm",
					"h-10 rounded-md px-8": size === "lg",
					"h-9 w-9": size === "icon",
				},
				className,
			)}
			{...props}
		/>
	);
});
Button.displayName = "Button";

export { Button };
