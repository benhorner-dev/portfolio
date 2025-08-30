import type { Meta, StoryObj } from "@storybook/react";
import { TypographyH1 } from "@/components/atoms/h1";
import { TypographyP } from "@/components/atoms/p";
import { SocialLink } from "@/components/atoms/socialLink";
import { Socials } from "@/components/molecules/socials";
import { Footer } from "./footer";

const meta: Meta<typeof Footer> = {
	title: "Organisms/Footer",
	component: Footer,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		title: {
			control: { type: "object" },
		},
		description: {
			control: { type: "object" },
		},
		socials: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: <TypographyH1 text="Get In Touch" />,
		description: (
			<TypographyP text="Ready to start your next project? Let's talk about how we can help bring your ideas to life." />
		),
		socials: (
			<Socials
				links={[
					<SocialLink
						key="github"
						href="https://github.com"
						alt="GitHub"
						src="/images/github.png"
					/>,
					<SocialLink
						key="linkedin"
						href="https://linkedin.com"
						alt="LinkedIn"
						src="/images/linkedin.png"
					/>,
				]}
			/>
		),
	},
};

export const WithLongDescription: Story = {
	args: {
		title: <TypographyH1 text="Contact Us" />,
		description: (
			<TypographyP text="We're always excited to hear from potential clients and collaborators. Whether you have a specific project in mind or just want to learn more about our services, don't hesitate to reach out. Our team is passionate about creating exceptional digital experiences and we'd love to discuss how we can help bring your vision to reality." />
		),
		socials: (
			<Socials
				links={[
					<SocialLink
						key="github"
						href="https://github.com"
						alt="GitHub"
						src="/images/github.png"
					/>,
					<SocialLink
						key="twitter"
						href="https://twitter.com"
						alt="Twitter"
						src="/images/twitter.png"
					/>,
					<SocialLink
						key="linkedin"
						href="https://linkedin.com"
						alt="LinkedIn"
						src="/images/linkedin.png"
					/>,
				]}
			/>
		),
	},
};
