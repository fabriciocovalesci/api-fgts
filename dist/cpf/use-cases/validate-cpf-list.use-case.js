"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateCpfListUseCase = void 0;
const common_1 = require("@nestjs/common");
const cpf_cnpj_validator_1 = require("cpf-cnpj-validator");
let ValidateCpfListUseCase = class ValidateCpfListUseCase {
    validate(cpfList) {
        return cpfList.map(cpf => ({
            cpf,
            isValid: cpf_cnpj_validator_1.cpf.isValid(cpf)
        }));
    }
};
exports.ValidateCpfListUseCase = ValidateCpfListUseCase;
exports.ValidateCpfListUseCase = ValidateCpfListUseCase = __decorate([
    (0, common_1.Injectable)()
], ValidateCpfListUseCase);
//# sourceMappingURL=validate-cpf-list.use-case.js.map