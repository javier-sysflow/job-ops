// English strings: welcome messages shown above the job list.
// The English lines themselves come from shared/src/messages/jobs-welcome.json
// (used as-is by useWelcomeMessage), so `lines` stays empty here. Other
// languages define their own lines with a {{name}} placeholder.
const welcome = {
  fallbackName: "User",
  lines: [] as string[],
};

export default welcome;
