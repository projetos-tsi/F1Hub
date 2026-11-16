const STORAGE_KEY = 'f1hub.cart.v1';

function readCart() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        return [];
    }
}

function writeCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('f1hub:cart-updated', { detail: items }));
    return items;
}

export const cartService = {
    getItems: readCart,

    add(productId, size, quantity = 1) {
        const items = readCart();
        const existing = items.find((item) => item.productId === productId && item.size === size);
        if (existing) existing.quantity += quantity;
        else items.push({ productId, size, quantity });
        return writeCart(items);
    },

    update(productId, size, quantity) {
        if (quantity <= 0) return this.remove(productId, size);
        const items = readCart();
        const item = items.find((entry) => entry.productId === productId && entry.size === size);
        if (item) item.quantity = quantity;
        return writeCart(items);
    },

    remove(productId, size) {
        return writeCart(readCart().filter((item) => !(item.productId === productId && item.size === size)));
    },

    clear() {
        return writeCart([]);
    },

    count() {
        return readCart().reduce((total, item) => total + item.quantity, 0);
    }
};
