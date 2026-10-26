const pad = (value: number) => String(value).padStart(2, "0");

export const nowDateTimeInput = () => {
	const now = new Date();
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};
