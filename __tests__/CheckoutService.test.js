const { CheckoutService } = require('../src/services/CheckoutService');
const CarrinhoBuilder = require('./builders/CarrinhoBuilder');
const UserMother = require('./builders/UserMother');
const { Item } = require('../src/domain/Item');

// Dependências do SUT
const { GatewayPagamento } = require('../src/services/GatewayPagamento');
const { EmailService } = require('../src/services/EmailService');
const { PedidoRepository } = require('../src/services/PedidoRepository');

// Mockando as dependências (Jest precisa do caminho do módulo)
jest.mock('../src/services/GatewayPagamento', () => ({ GatewayPagamento: { cobrar: jest.fn() } }));
jest.mock('../src/services/EmailService', () => ({ EmailService: { enviarEmail: jest.fn() } }));
jest.mock('../src/services/PedidoRepository', () => ({ PedidoRepository: { salvar: jest.fn() } }));

describe('CheckoutService', () => {
    let checkoutService;

    beforeEach(() => {
        // Limpa os mocks antes de cada teste
        jest.clearAllMocks();

        // Instancia o SUT com as dependências mockadas
        checkoutService = new CheckoutService(
            GatewayPagamento,
            PedidoRepository,
            EmailService
        );
    });

    // Etapa 4: Padrão Stub (Verificação de Estado)
    describe('quando o pagamento falha', () => {
        it('deve retornar null e não chamar o repositório ou serviço de email', async () => {
            // Arrange
            const carrinho = CarrinhoBuilder.umCarrinho().build();

            // 1. Stub para GatewayPagamento: retorna falha
            GatewayPagamento.cobrar.mockResolvedValue({ success: false });

            // 2. Dublês vazios (Dummies) para as outras dependências
            // O jest.mock já faz com que elas sejam "dublês vazios" por padrão,
            // mas podemos garantir que não serão chamadas.
            PedidoRepository.salvar.mockResolvedValue(null);
            EmailService.enviarEmail.mockResolvedValue(null);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho);

            // Assert (Verificação de Estado)
            expect(pedido).toBeNull();

            // Verificações de Comportamento (Garantindo que os Dummies não foram chamados)
            expect(PedidoRepository.salvar).not.toHaveBeenCalled();
            expect(EmailService.enviarEmail).not.toHaveBeenCalled();
        });
    });

    // Etapa 5: Padrão Mock (Verificação de Comportamento)
    describe('quando um cliente Premium finaliza a compra', () => {
        it('deve aplicar desconto, salvar o pedido e enviar email de sucesso', async () => {
            // Arrange
            const userPremium = UserMother.umUsuarioPremium();
            const itens = [
                { preco: 100.00, quantidade: 1 },
                { preco: 100.00, quantidade: 1 }
            ]; // Total: R$ 200,00
            const carrinho = CarrinhoBuilder.umCarrinho()
                .comUser(userPremium)
                .comItens([new Item('Item 1', 100.00), new Item('Item 2', 100.00)])
                .build();

            const valorComDesconto = 180.00; // 200.00 - 10%

            // 1. Stub para GatewayPagamento: retorna sucesso
            GatewayPagamento.cobrar.mockResolvedValue({ success: true });

            // 2. Stub para PedidoRepository: retorna um pedido salvo
            const pedidoSalvo = { id: 1, valor: valorComDesconto };
            PedidoRepository.salvar.mockResolvedValue(pedidoSalvo);

            // 3. Mock para EmailService: para verificar se foi chamado
            // O jest.mock já o transforma em Mock, mas vamos garantir que ele não tem implementação padrão
            EmailService.enviarEmail.mockResolvedValue(true);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho);

            // Assert (Verificação de Estado)
            expect(pedido).toEqual(pedidoSalvo);

            // Assert (Verificação de Comportamento)

            // 1. Verifique se o GatewayPagamento foi chamado com o valor correto (com desconto)
            expect(GatewayPagamento.cobrar).toHaveBeenCalledWith(valorComDesconto, userPremium);

            // 2. Verifique se o EmailService foi chamado 1 vez, com os argumentos corretos
            expect(EmailService.enviarEmail).toHaveBeenCalledTimes(1);
            expect(EmailService.enviarEmail).toHaveBeenCalledWith(
                userPremium.email,
                'Seu Pedido foi Aprovado!',
                expect.stringContaining('R$180') // Verifica se o valor com desconto está na mensagem
            );
        });
    });
});
