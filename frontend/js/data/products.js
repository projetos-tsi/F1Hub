const apparelSizes = ['P', 'M', 'G', 'GG'];
const oneSize = ['Único'];

const product = (id, team, category, pilot, image, name, price, sizes = apparelSizes) => ({
    id, team, category, pilot, image, name, price, sizes
});

export const teamMeta = {
    ferrari: { name: 'Ferrari', color: '#ed1320', label: 'SCUDERIA FERRARI' },
    mercedes: { name: 'Mercedes', color: '#078d84', label: 'MERCEDES-AMG PETRONAS' },
    rbr: { name: 'Red Bull', color: '#021627', label: 'ORACLE RED BULL RACING' },
    mclaren: { name: 'McLaren', color: '#d47200', label: 'McLAREN FORMULA 1 TEAM' },
    williams: { name: 'Williams', color: '#0442fc', label: 'WILLIAMS RACING' }
};

export const categoryMeta = {
    'Camisa Polo': {
        description: 'Visual inspirado no paddock, com acabamento estruturado e conforto para acompanhar a temporada dentro e fora dos autódromos.',
        details: ['Modelagem regular e confortável.', 'Gola e punhos estruturados.', 'Acabamento reforçado para maior durabilidade.', 'Estampa aplicada com alta definição.']
    },
    'Camiseta': {
        description: 'Uma peça leve e versátil para levar as cores da sua equipe a qualquer lugar, com caimento confortável e identidade de pista.',
        details: ['Tecido leve e respirável.', 'Modelagem unissex confortável.', 'Costuras reforçadas nos ombros.', 'Estampa resistente ao uso diário.']
    },
    'Boné': {
        description: 'Proteção e identidade de equipe em um acessório desenvolvido para completar o visual de quem vive a Fórmula 1.',
        details: ['Ajuste traseiro regulável.', 'Aba estruturada.', 'Bordados e aplicações de alta definição.', 'Tamanho único.']
    },
    'Moletom': {
        description: 'Conforto térmico com visual de equipe para os dias frios, mantendo a presença das pistas em uma peça versátil.',
        details: ['Interior macio e confortável.', 'Punhos e barra canelados.', 'Modelagem regular.', 'Aplicações inspiradas na equipe.']
    },
    'Jaqueta': {
        description: 'Construção inspirada nos uniformes de equipe, combinando proteção, presença e acabamento para um visual de paddock.',
        details: ['Fechamento frontal por zíper.', 'Punhos estruturados.', 'Bolsos laterais funcionais.', 'Aplicações inspiradas na equipe.']
    },
    'Blusa': {
        description: 'Uma camada confortável e marcante para torcer pela equipe, com acabamento pensado para o uso cotidiano.',
        details: ['Tecido encorpado e confortável.', 'Modelagem regular.', 'Acabamento reforçado.', 'Aplicações inspiradas na equipe.']
    }
};

export const products = [
    product('ferrari-polo-hp-unissex', 'ferrari', 'Camisa Polo', 'Equipe', 'polo-ferrari.png', 'Camisa Scuderia Ferrari HP Unissex', 20990),
    product('ferrari-polo-hypercar-2026', 'ferrari', 'Camisa Polo', 'Equipe', 'polo-ferrari2.png', 'Camisa Polo Ferrari Hypercar Replica 2026', 13990),
    product('ferrari-jaqueta-driver', 'ferrari', 'Jaqueta', 'Equipe', 'blusa-ferrari.png', 'Jaqueta Scuderia Ferrari Replica Driver Autêntica Racing', 36990),
    product('ferrari-bone-leclerc', 'ferrari', 'Boné', 'Charles Leclerc', 'bone-ferrari.png', 'Boné Scuderia Ferrari LeClerc Juvenil', 11990, oneSize),
    product('ferrari-polo-replica-2026', 'ferrari', 'Camisa Polo', 'Equipe', 'polo-ferrari3.png', 'Camisa Polo Scuderia Ferrari Replica 2026', 15990),
    product('ferrari-jaqueta-hypercar-2026', 'ferrari', 'Jaqueta', 'Equipe', 'blusa-ferrari2.png', 'Jaqueta Ferrari Hypercar Replica 2026', 27990),
    product('ferrari-camiseta-drivers', 'ferrari', 'Camiseta', 'Equipe', 'camisa-ferrari.png', 'Camiseta Scuderia Ferrari Replica Drivers Auth', 10990),
    product('ferrari-camiseta-hypercar-2026', 'ferrari', 'Camiseta', 'Equipe', 'camisa-ferrari2.png', 'Camiseta Ferrari Hypercar Replica 2026', 10990),
    product('ferrari-camiseta-replica', 'ferrari', 'Camiseta', 'Equipe', 'camisa-ferrari3.png', 'Camiseta Scuderia Ferrari Replica', 10990),

    product('mercedes-polo-2025-preta', 'mercedes', 'Camisa Polo', 'Equipe', 'polo-mercedes.png', 'Camisa Polo Mercedes 2025 Preta', 15990),
    product('mercedes-bone-mechanics', 'mercedes', 'Boné', 'Equipe', 'bone-mercedes.png', 'Boné Trucker Mechanics Adidas Mercedes', 11990, oneSize),
    product('mercedes-polo-2026-preta', 'mercedes', 'Camisa Polo', 'Equipe', 'polo-mercedes2.png', 'Camisa Polo Mercedes 2026 Preta', 16990),
    product('mercedes-blusa-2025-preta', 'mercedes', 'Blusa', 'Equipe', 'blusa-mercedes.png', 'Blusa Mercedes 2025 Preta', 22990),
    product('mercedes-dryfit-2025-branca', 'mercedes', 'Camiseta', 'Equipe', 'dryfit-mercedes.png', 'Dryfit Mercedes 2025 Branca', 15990),
    product('mercedes-blusa-2025-branca', 'mercedes', 'Blusa', 'Equipe', 'blusa-mercedes2.png', 'Blusa Mercedes 2025 Branca', 22990),
    product('mercedes-jaqueta-2025-preta', 'mercedes', 'Jaqueta', 'Equipe', 'jaqueta-mercedes.png', 'Jaqueta Mercedes 2025 Preta', 24990),
    product('mercedes-moletom-2025-preto', 'mercedes', 'Moletom', 'Equipe', 'moletom-mercedes.png', 'Moletom Mercedes 2025 Preto', 18990),
    product('mercedes-moletom-2025-branco', 'mercedes', 'Moletom', 'Equipe', 'moletom-mercedes2.png', 'Moletom Mercedes 2025 Branco', 15990),

    product('redbull-polo-equipe-2025', 'rbr', 'Camisa Polo', 'Equipe', 'polo-redbull.png', 'Camiseta Polo Red Bull Equipe Azul Marinho 2025', 14990),
    product('redbull-bone-9fifty', 'rbr', 'Boné', 'Equipe', 'bone-redbull.png', 'Boné 9FIFTY Original Fit Red Bull Racing', 10990, oneSize),
    product('redbull-dryfit-verstappen-preto-2025', 'rbr', 'Camiseta', 'Max Verstappen', 'camisa-redbull.png', 'Camiseta Dryfit Red Bull Max Verstappen Preto 2025', 10990),
    product('redbull-algodao-verstappen-2025', 'rbr', 'Camiseta', 'Max Verstappen', 'camisa-redbull2.png', 'Camiseta Algodão Red Bull Max Verstappen Azul Marinho 2025', 10990),
    product('redbull-dryfit-verstappen-2026', 'rbr', 'Camiseta', 'Max Verstappen', 'camisa-redbull3.png', 'Camiseta Dryfit Max Verstappen Red Bull 2026', 10990),
    product('redbull-dryfit-japao-2025', 'rbr', 'Camiseta', 'Equipe', 'camisa-redbull4.png', 'Camiseta Dryfit Red Bull Racing Edição Especial Japão 2025', 10990),
    product('redbull-dryfit-verstappen-azul-2025', 'rbr', 'Camiseta', 'Max Verstappen', 'camisa-redbull5.png', 'Camiseta Dryfit Red Bull Max Verstappen Azul Marinho 2025', 10990),
    product('redbull-moletom-turquia-black', 'rbr', 'Moletom', 'Equipe', 'blusa-redbull.png', 'Moletom Canguru Red Bull Turquia 2021 Black', 20990),
    product('redbull-moletom-turquia-offwhite', 'rbr', 'Moletom', 'Equipe', 'blusa-redbull2.png', 'Moletom Canguru Red Bull Turquia 2021 Off White', 20990),

    product('mclaren-moletom-piastri-2026', 'mclaren', 'Moletom', 'Oscar Piastri', 'blusa-mclaren.png', 'Moletom Canguru Oscar Piastri McLaren F1 2026 Preto', 20990),
    product('mclaren-polo-equipe-2026', 'mclaren', 'Camisa Polo', 'Equipe', 'polo-mclaren.png', 'Camisa Polo McLaren F1 Team 2026', 17990),
    product('mclaren-polo-senna', 'mclaren', 'Camisa Polo', 'Ayrton Senna', 'polo-mclaren2.png', 'Camisa Polo Fanwear McLaren Senna', 19990),
    product('mclaren-polo-norris-2026', 'mclaren', 'Camisa Polo', 'Lando Norris', 'polo-mclaren3.png', 'Camisa Polo Lando Norris McLaren F1 2026', 15990),
    product('mclaren-camiseta-norris-2026', 'mclaren', 'Camiseta', 'Lando Norris', 'camisa-mclaren.png', 'Camiseta Lando Norris McLaren F1 2026 Algodão', 10990),
    product('mclaren-dryfit-marlboro-retro', 'mclaren', 'Camiseta', 'Equipe', 'camisa-mclaren2.png', 'Camiseta Dryfit McLaren Marlboro Vermelho Retrô', 11990),
    product('mclaren-moletom-retro-vermelho', 'mclaren', 'Moletom', 'Equipe', 'moletom-mclaren.png', 'Moletom McLaren Equipe Retrô Vermelho Careca', 19990),
    product('mclaren-moletom-2025-preto', 'mclaren', 'Moletom', 'Equipe', 'moletom-mclaren2.png', 'Moletom McLaren 2025 Preto', 18990),
    product('mclaren-jaqueta-norris-2025', 'mclaren', 'Jaqueta', 'Lando Norris', 'jaqueta-mclaren.png', 'Jaqueta McLaren 2025 Lando Norris', 19990),

    product('williams-dryfit-sainz-azul-2025', 'williams', 'Camiseta', 'Carlos Sainz', 'dryfit-williams.png', 'Camiseta Dryfit Williams Carlos Sainz Azul Marinho 2025', 12990),
    product('williams-jaqueta-rp-hybrid', 'williams', 'Jaqueta', 'Equipe', 'jaqueta-williams.png', 'Jaqueta Williams Racing RP Hybrid Azul Marinho', 18000),
    product('williams-polo-equipe-2025', 'williams', 'Camisa Polo', 'Equipe', 'polo-williams.png', 'Camiseta Polo Williams Equipe Azul Marinho 2025', 15990),
    product('williams-moletom-2026-branco', 'williams', 'Moletom', 'Equipe', 'blusa-williams.png', 'Moletom Canguru Williams F1 2026 Branco', 20990),
    product('williams-moletom-sainz-2026', 'williams', 'Moletom', 'Carlos Sainz', 'blusa-williams2.png', 'Moletom Canguru Carlos Sainz Williams 2026 Azul Marinho', 20990),
    product('williams-dryfit-team-2026', 'williams', 'Camiseta', 'Equipe', 'camisa-williams.png', 'Camiseta Williams Team 2026 Dryfit', 10990),
    product('williams-dryfit-sainz-preto-2025', 'williams', 'Camiseta', 'Carlos Sainz', 'camisa-williams2.png', 'Camiseta Dryfit Williams Carlos Sainz Preto 2025', 10990),
    product('williams-dryfit-sainz-branco-2025', 'williams', 'Camiseta', 'Carlos Sainz', 'camisa-williams3.png', 'Camiseta Dryfit Williams Carlos Sainz Branco 2025', 10990),
    product('williams-moletom-rothmans-retro', 'williams', 'Moletom', 'Equipe', 'moletom-williams.png', 'Moletom Williams Retrô Rothmans Racing Branco', 18990)
];

// Preço "de" (exibido riscado) dos produtos em promoção, em centavos.
// O preço de venda continua sendo o campo `price` de cada produto.
export const promotions = {
    'ferrari-jaqueta-driver': 42990,
    'mercedes-jaqueta-2025-preta': 29990,
    'redbull-moletom-turquia-black': 24990,
    'mclaren-moletom-retro-vermelho': 23990,
    'mclaren-dryfit-marlboro-retro': 13990,
    'williams-jaqueta-rp-hybrid': 22990
};
