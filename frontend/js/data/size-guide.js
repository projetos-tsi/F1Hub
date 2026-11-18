// Guia de medidas exibido na página de produto (peças com tamanhos P–GG).
// Medidas APROXIMADAS da peça, em centímetros, a serem validadas pela equipe.
// (Os produtos, equipes e categorias vêm do banco pela API; este guia é só conteúdo de apoio.)
export const sizeGuide = {
    note: 'Medidas aproximadas da peça, com variação de até 2 cm. Meça uma peça que você já usa e compare.',
    rows: [
        { size: 'P', chest: 50, length: 70 },
        { size: 'M', chest: 53, length: 72 },
        { size: 'G', chest: 56, length: 74 },
        { size: 'GG', chest: 59, length: 76 }
    ]
};
