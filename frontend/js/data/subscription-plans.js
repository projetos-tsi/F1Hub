// Planos da assinatura F1Hub Box.
// Estrutura pensada para virar a tabela `planos` no banco (id, nome, preço mensal, descrição, itens, destaque).
// Preços em centavos. Valores e benefícios são uma PROPOSTA e devem ser validados pela equipe.
export const subscriptionPlans = [
    {
        id: 'pit-stop',
        name: 'Pit Stop',
        price: 4990,
        tagline: 'Para começar a coleção',
        includesShirt: false,
        highlight: false,
        items: [
            '1 mimo surpresa por mês (chaveiro, pin ou adesivos)',
            'Cartão colecionável exclusivo do mês',
            'Tema da sua equipe favorita'
        ]
    },
    {
        id: 'podio',
        name: 'Pódio',
        price: 8990,
        tagline: 'O equilíbrio perfeito',
        includesShirt: true,
        highlight: true,
        items: [
            '2 mimos surpresa por mês',
            '1 camiseta exclusiva a cada 3 meses',
            'Cartão colecionável exclusivo do mês',
            '5% OFF extra nas compras da loja'
        ]
    },
    {
        id: 'campeao',
        name: 'Campeão',
        price: 14990,
        tagline: 'Para quem vive a F1 o ano todo',
        includesShirt: true,
        highlight: false,
        items: [
            '1 camiseta exclusiva todo mês',
            '2 mimos surpresa por mês',
            'Caixa edição de colecionador',
            '10% OFF extra nas compras da loja'
        ]
    }
];

// Opção extra para quem não quer escolher uma única equipe.
export const surpriseTeam = { id: 'surpresa', name: 'Surpresa', label: 'Todas as equipes' };
