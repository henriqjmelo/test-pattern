const { Carrinho } = require('../../src/domain/Carrinho');
const { Item } = require('../../src/domain/Item');
const UserMother = require('./UserMother');

class CarrinhoBuilder {
    constructor() {
        // Valores padrão
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [
            new Item('Item Padrão', 100.00)
        ];
    }

    static umCarrinho() {
        return new CarrinhoBuilder();
    }

    comUser(user) {
        this.user = user;
        return this;
    }

    comItens(itens) {
        this.itens = itens;
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        return new Carrinho(this.user, this.itens);
    }
}

module.exports = CarrinhoBuilder;
