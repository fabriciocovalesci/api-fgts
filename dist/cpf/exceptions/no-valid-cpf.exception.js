"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoValidCpfException = void 0;
const common_1 = require("@nestjs/common");
class NoValidCpfException extends common_1.HttpException {
    constructor() {
        super('Nenhum CPF válido foi encontrado na lista.', common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.NoValidCpfException = NoValidCpfException;
//# sourceMappingURL=no-valid-cpf.exception.js.map