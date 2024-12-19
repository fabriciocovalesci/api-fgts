"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CpfModule = void 0;
const common_1 = require("@nestjs/common");
const cpf_controller_1 = require("./cpf.controller");
const cpf_service_1 = require("./cpf.service");
const validate_cpf_list_use_case_1 = require("./use-cases/validate-cpf-list.use-case");
const external_api_module_1 = require("../external-api/external-api.module");
let CpfModule = class CpfModule {
};
exports.CpfModule = CpfModule;
exports.CpfModule = CpfModule = __decorate([
    (0, common_1.Module)({
        imports: [external_api_module_1.ExternalApiModule],
        controllers: [cpf_controller_1.CpfController],
        providers: [
            cpf_service_1.CpfService,
            validate_cpf_list_use_case_1.ValidateCpfListUseCase,
        ],
    })
], CpfModule);
//# sourceMappingURL=cpf.module.js.map