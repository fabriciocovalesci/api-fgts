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
var ExternalApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const http_service_1 = require("../http/http.service");
let ExternalApiService = ExternalApiService_1 = class ExternalApiService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(ExternalApiService_1.name);
        this.enpoint = this.configService.get('BASE_URL');
    }
    config(timeout, delay, rateLimitPoints, rateLimitDuration) {
        return {
            timeout: timeout,
            delay: delay,
            rateLimitPoints: rateLimitPoints,
            rateLimitDuration: rateLimitDuration
        };
    }
    async getProducts(timeout, delay, rateLimitPoints, rateLimitDuration) {
        this.logger.log('Searching for products');
        const products = await this.httpService.get(`${this.enpoint}/v1/Product`, this.config(timeout, delay, rateLimitPoints, rateLimitDuration), delay, timeout);
        this.logger.log('Products found');
        return products.data;
    }
    async getProductByNames(productName, timeout, delay, rateLimitPoints, rateLimitDuration) {
        this.logger.log(`Searching for product ${productName}`);
        const listProducts = await this.httpService.get(`${this.enpoint}/v1/Product`, this.config(timeout, delay, rateLimitPoints, rateLimitDuration), delay, timeout);
        const product = listProducts?.data.find((product) => product.name === productName);
        if (!product) {
            this.logger.error(`Product ${productName} not found`);
            throw new common_1.HttpException('Product not found', common_1.HttpStatus.NOT_FOUND);
        }
        this.logger.log(`Product ${productName} found`);
        return {
            id: product.id,
            minimumInterestRate: product.minimumInterestRate
        };
    }
    async simulationFGTS(productName, cpf, timeout, delay, rateLimitPoints, rateLimitDuration) {
        this.logger.log(`Simulating FGTS for CPF: ${cpf}`);
        try {
            const product = await this.getProductByNames(productName, timeout, delay, rateLimitPoints, rateLimitDuration);
            const data = {
                amortization: {
                    agentCommission: {
                        amount: 0,
                        type: "Percentage",
                        baseValue: "InitialValue"
                    },
                    apr: product.minimumInterestRate,
                    termInMonths: 10,
                    startDate: new Date().toISOString(),
                    requestedAmount: 0,
                    amortizationType: "fgts"
                },
                registrationNumber: cpf,
                personId: null,
                legalPerson: false,
                productId: product.id,
            };
            const simulation = await this.httpService.post(`${this.enpoint}/v1/Amortization`, data, this.config(timeout, delay, rateLimitPoints, rateLimitDuration), delay, timeout, rateLimitDuration);
            this.logger.log(`Simulation FGTS for CPF ${cpf} completed successfully`);
            return simulation;
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            this.logger.error(`Error during FGTS simulation for CPF ${cpf}: ${errorMessage}`, error.stack);
            return {
                cpf,
                error: true,
                message: errorMessage,
                statusCode: error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            };
        }
    }
};
exports.ExternalApiService = ExternalApiService;
exports.ExternalApiService = ExternalApiService = ExternalApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [http_service_1.HttpService,
        config_1.ConfigService])
], ExternalApiService);
//# sourceMappingURL=external-api.service.js.map