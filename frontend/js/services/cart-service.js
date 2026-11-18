// Carrinho da loja: fica no navegador (localStorage) até a finalização do pedido.
// Guarda apenas o produto (slug), o tamanho e a quantidade — nunca o preço: o valor exibido
// vem sempre do catálogo carregado do banco, e o servidor recalcula o total ao fechar o pedido.
const STORAGE_KEY = 'f1hub.cart.v1';
const NOTICE_KEY = 'f1hub.cart.removed';

/** Limites por pedido (os mesmos conferidos pelo servidor em OrderService). */
export const CART_LIMITS = { quantity: 10, lines: 20 };

function readCart() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!Array.isArray(parsed)) return [];
        // Descarta entradas malformadas e mantém a quantidade entre 1 e o limite.
        return parsed
            .filter((item) => item && typeof item.productId === 'string' && typeof item.size === 'string' && Number.isInteger(item.quantity) && item.quantity > 0)
            .map((item) => ({ productId: item.productId, size: item.size, quantity: Math.min(item.quantity, CART_LIMITS.quantity) }))
            .slice(0, CART_LIMITS.lines);
    } catch (_error) {
        return [];
    }
}

function writeCart(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_error) {
        // Armazenamento indisponível (ex.: modo privado restrito): o carrinho vale só nesta página.
    }
    window.dispatchEvent(new CustomEvent('f1hub:cart-updated', { detail: items }));
    return items;
}

export const cartService = {
    getItems: readCart,

    /**
     * Adiciona ao carrinho respeitando os limites.
     * Devolve { added, reason } — reason: 'quantity' (já tem o máximo deste item) ou 'lines' (itens diferentes demais).
     */
    add(productId, size, quantity = 1) {
        const items = readCart();
        const existing = items.find((item) => item.productId === productId && item.size === size);
        if (existing) {
            if (existing.quantity >= CART_LIMITS.quantity) return { added: false, reason: 'quantity' };
            existing.quantity = Math.min(existing.quantity + quantity, CART_LIMITS.quantity);
        } else {
            if (items.length >= CART_LIMITS.lines) return { added: false, reason: 'lines' };
            items.push({ productId, size, quantity: Math.min(quantity, CART_LIMITS.quantity) });
        }
        writeCart(items);
        return { added: true, reason: null };
    },

    update(productId, size, quantity) {
        if (quantity <= 0) return this.remove(productId, size);
        const items = readCart();
        const item = items.find((entry) => entry.productId === productId && entry.size === size);
        if (item) item.quantity = Math.min(quantity, CART_LIMITS.quantity);
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
    },

    /**
     * Remove os itens que não podem mais ser comprados (produto desativado/excluído ou tamanho retirado).
     * A quantidade removida fica guardada para o aviso exibido no carrinho e na finalização.
     */
    prune(isAvailable) {
        const items = readCart();
        const kept = items.filter((item) => isAvailable(item.productId, item.size));
        const removed = items.length - kept.length;
        if (removed > 0) {
            writeCart(kept);
            try {
                localStorage.setItem(NOTICE_KEY, String(this.removedNotice(false) + removed));
            } catch (_error) { /* sem armazenamento: o aviso não é exibido */ }
        }
        return removed;
    },

    /** Quantos itens indisponíveis foram removidos desde o último aviso (e apaga o aviso, se clear = true). */
    removedNotice(clear = true) {
        try {
            const count = Number.parseInt(localStorage.getItem(NOTICE_KEY), 10) || 0;
            if (clear) localStorage.removeItem(NOTICE_KEY);
            return count;
        } catch (_error) {
            return 0;
        }
    }
};
