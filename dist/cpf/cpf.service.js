"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CpfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CpfService = void 0;
const common_1 = require("@nestjs/common");
const validate_cpf_list_use_case_1 = require("./use-cases/validate-cpf-list.use-case");
const no_valid_cpf_exception_1 = require("./exceptions/no-valid-cpf.exception");
const config_1 = require("@nestjs/config");
const external_api_service_1 = require("../external-api/external-api.service");
const path = require("path");
const fs = require("fs");
const json2csv_1 = require("json2csv");
let CpfService = CpfService_1 = class CpfService {
    constructor(validateCpfListUseCase, configService, consultSimulation) {
        this.validateCpfListUseCase = validateCpfListUseCase;
        this.configService = configService;
        this.consultSimulation = consultSimulation;
        this.logger = new common_1.Logger(CpfService_1.name);
        this.enpoint = this.configService.get('BASE_URL');
    }
    saveToCsv(data, fileName) {
        try {
            const fields = Object.keys(data[0]);
            const opts = { fields };
            const csv = (0, json2csv_1.parse)(data, opts);
            const filePath = path.join(__dirname, '../../exports', fileName);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, csv, 'utf8');
            this.logger.log(`Arquivo CSV salvo em: ${filePath}`);
            return filePath;
        }
        catch (err) {
            this.logger.error('Erro ao gerar CSV:', err);
            throw new Error('Falha ao salvar arquivo CSV');
        }
    }
    async getProductsExternalApi(timeout, delay, rateLimitPoints, rateLimitDuration) {
        try {
            const products = await this.consultSimulation.getProducts(timeout, delay, rateLimitPoints, rateLimitDuration);
            return products;
        }
        catch (error) {
            this.logger.error('Erro ao consultar produtos:', error);
            throw new common_1.BadRequestException('Erro ao consultar produtos');
        }
    }
    async processCpfListAndConsultExternalApi(cpfList, delay, timeout, rateLimitPoints, rateLimitDuration, productName) {
        const validationResults = this.validateCpfListUseCase.validate(cpfList);
        const validCpfs = validationResults.filter(result => result.isValid).map(result => result.cpf);
        if (validCpfs.length === 0) {
            this.logger.error('Nenhum CPF válido encontrado');
            throw new no_valid_cpf_exception_1.NoValidCpfException();
        }
        let result = [];
        for (const cpf of validCpfs) {
            const data = await this.consultSimulation.simulationFGTS(productName, cpf, timeout, delay, rateLimitPoints, rateLimitDuration);
            this.logger.log(`CPF ${cpf} consultado com sucesso - ${data}`);
            result.push(data);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `consultas-${timestamp}.csv`;
        this.saveToCsv(result, fileName);
        this.logger.log('Todos os CPFs foram consultados com sucesso');
        return result;
    }
    async processCpfBatchAndConsultExternalApi() {
    }
};
exports.CpfService = CpfService;
exports.CpfService = CpfService = CpfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [validate_cpf_list_use_case_1.ValidateCpfListUseCase,
        config_1.ConfigService,
        external_api_service_1.ExternalApiService])
], CpfService);
//# sourceMappingURL=cpf.service.js.map