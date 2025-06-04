export const buttonStyles = {
  primary:
    "bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200",
  danger:
    "bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200",
  disabled: "opacity-50 cursor-not-allowed",
};

export const inputStyles = {
  base: "w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
  error: "border-red-500 focus:ring-red-500 focus:border-red-500",
};

export const formStyles = {
  container: "flex flex-col gap-4 bg-slate-50 p-4 rounded-lg",
  field: "flex flex-col gap-2",
  label: "text-sm font-medium text-gray-700",
  error: "text-red-500 text-sm mt-1",
};
