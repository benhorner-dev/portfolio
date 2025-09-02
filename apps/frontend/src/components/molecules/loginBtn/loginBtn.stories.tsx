import type { Meta, StoryObj } from "@storybook/react";
import { LoginButton } from "@/components/molecules/loginBtn";

const meta: Meta<typeof LoginButton> = {
	title: "Molecules/LoginButton",
	component: LoginButton,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A styled login button component that renders as a Next.js Link with custom blue theming. The button automatically navigates to the authentication page with a return URL parameter.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		text: {
			control: { type: "text" },
			description: "The text displayed on the login button",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: "Login",
	},
};

export const SignIn: Story = {
	args: {
		text: "Sign In",
	},
};

export const GetStarted: Story = {
	args: {
		text: "Get Started",
	},
};

export const JoinNow: Story = {
	args: {
		text: "Join Now",
	},
};

export const AccessAccount: Story = {
	args: {
		text: "Access Account",
	},
};

export const ContinueWithLogin: Story = {
	args: {
		text: "Continue with Login",
	},
};

export const LoginToContinue: Story = {
	args: {
		text: "Login to Continue",
	},
};

export const Authenticate: Story = {
	args: {
		text: "Authenticate",
	},
};

export const ConnectAccount: Story = {
	args: {
		text: "Connect Account",
	},
};

export const EnterDashboard: Story = {
	args: {
		text: "Enter Dashboard",
	},
};

export const LongText: Story = {
	args: {
		text: "Login to Access Premium Features",
	},
};

export const WithIcon: Story = {
	args: {
		text: "🔐 Secure Login",
	},
};

export const CallToAction: Story = {
	args: {
		text: "Start Your Journey",
	},
};

export const Professional: Story = {
	args: {
		text: "Access Portal",
	},
};

export const Friendly: Story = {
	args: {
		text: "Let's Get Started!",
	},
};

export const Minimal: Story = {
	args: {
		text: "Go",
	},
};
