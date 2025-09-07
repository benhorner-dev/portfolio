// Mock for os module in browser environment
export const platform = "browser";
export const arch = "x64";
export const cpus = () => [];
export const totalmem = () => 0;
export const freemem = () => 0;
export const uptime = () => 0;
export const loadavg = () => [0, 0, 0];
export const networkInterfaces = () => ({});
export const homedir = () => "/";
export const tmpdir = () => "/tmp";
export const hostname = () => "browser";
export const type = () => "Browser";
export const release = () => "1.0.0";
export const userInfo = () => ({
	username: "browser",
	uid: 0,
	gid: 0,
	shell: null,
	homedir: "/",
});

export default {
	platform,
	arch,
	cpus,
	totalmem,
	freemem,
	uptime,
	loadavg,
	networkInterfaces,
	homedir,
	tmpdir,
	hostname,
	type,
	release,
	userInfo,
};
