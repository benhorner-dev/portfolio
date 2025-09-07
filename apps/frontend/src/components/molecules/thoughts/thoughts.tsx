import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/atoms/accordion";
import type { ChatMessage } from "@/lib/explore/types";

interface ThoughtsProps {
	thoughts: string[];
	message: ChatMessage;
}

export const Thoughts = ({ thoughts, message }: ThoughtsProps) => {
	return (
		<div
			className={`overflow-hidden transition-all duration-300 ease-in-out mb-4 ${"opacity-100 max-h-96 transform translate-y-0"}`}
		>
			<Accordion type="single" collapsible>
				<AccordionItem value="item-1" className="border-none">
					<div className="bg-muted/30 backdrop-blur-sm border border-border rounded-lg shadow-[0_0_10px_var(--ctp-mauve)]/20">
						<AccordionTrigger className="px-4 py-3 hover:bg-muted/20 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-lg [&[data-state=open]>div>span]:no-underline hover:no-underline cursor-pointer">
							<div className="flex items-center space-x-2">
								<span className="font-mono text-sm font-medium text-foreground">
									🧠
								</span>
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<div className="px-4 pb-3 overflow-hidden">
								<div
									className={`bg-muted/20 backdrop-blur-sm border-t border-border/50 rounded-b-lg px-4 py-3 text-sm text-muted-foreground transition-all duration-300 ease-in-out ${"opacity-100 transform translate-y-0"}`}
								>
									<div className="space-y-2">
										{thoughts.map((thought, index) => (
											<div
												key={`${message.id}-${index}`}
												className="flex items-start space-x-2"
											>
												<div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5 shadow-[0_0_5px_var(--ctp-mauve)]"></div>
												<div className="flex-1 font-mono leading-relaxed">
													{thought}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</AccordionContent>
					</div>
				</AccordionItem>
			</Accordion>
		</div>
	);
};
