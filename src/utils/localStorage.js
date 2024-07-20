export const saveToLocalStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const loadFromLocalStorage = (key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
};
