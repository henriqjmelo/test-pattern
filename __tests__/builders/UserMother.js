const { User } = require('../../src/domain/User');

class UserMother {
    static umUsuarioPadrao() {
        return new User(1, 'Usuario Padrao', 'padrao@email.com', 'PADRAO');
    }

    static umUsuarioPremium() {
        return new User(2, 'Usuario Premium', 'premium@email.com', 'PREMIUM');
    }
}

module.exports = UserMother;
