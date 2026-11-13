export const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const formatDate = (ts) => new Date(ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

