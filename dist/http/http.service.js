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
var HttpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let HttpService = HttpService_1 = class HttpService {
    constructor(configService) {
        this.configService = configService;
        this.jwtToken = null;
        this.requestCount = 0;
        this.logger = new common_1.Logger(HttpService_1.name);
        this.basicAuthToken = this.configService.get('BASIC_AUTH_TOKEN');
    }
    async authenticate() {
        this.logger.log('Autenticando');
        if (!this.jwtToken) {
            const authResponse = await axios_1.default.post(this.configService.get('AUTH_URL'), new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'credit/admin',
            }), {
                headers: {
                    'Authorization': `Basic ${this.basicAuthToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            this.logger.log('Autenticado com sucesso');
            this.jwtToken = authResponse.data.access_token;
            setTimeout(() => {
                this.jwtToken = null;
            }, authResponse.data.expires_in * 1000);
        }
        this.logger.log('Autenticado reutilizando token');
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async rateLimitedRequest(config, delay = 0, rateLimitDuration = 60000) {
        await this.delay(delay);
        if (this.requestCount >= 10) {
            this.logger.error('Limite de requisições excedido');
            throw new common_1.HttpException('Limite de requisições excedido', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        this.requestCount++;
        setTimeout(() => {
            this.requestCount = 0;
        }, rateLimitDuration);
        try {
            const response = await (0, axios_1.default)(config);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Erro ao fazer requisição: ${error.message}`);
            if (error.response) {
                this.logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
                return error.response.data;
            }
            else {
                throw new common_1.HttpException('Erro ao fazer requisição', common_1.HttpStatus.BAD_GATEWAY);
            }
        }
    }
    async request(method, url, data, config = {}, delay = 0, timeout = 1000, rateLimitDuration = 60000) {
        if (!this.jwtToken) {
            await this.authenticate();
        }
        const authorizationHeader = this.jwtToken
            ? `Bearer ${this.jwtToken}`
            : `Basic ${this.basicAuthToken}`;
        const requestConfig = {
            ...config,
            method,
            url,
            data,
            timeout,
            headers: {
                ...config.headers,
                Authorization: authorizationHeader,
            },
        };
        this.logger.log(`Fazendo requisição endpoint ${url} - ${method} - ${JSON.stringify(data)}`);
        return this.rateLimitedRequest(requestConfig, delay, rateLimitDuration);
    }
    async get(url, config = {}, delay = 0, timeout = 1000, rateLimitDuration = 60000) {
        return this.request('GET', url, null, config, delay, timeout, rateLimitDuration);
    }
    async post(url, data, config = {}, delay = 0, timeout = 1000, rateLimitDuration = 60000) {
        return this.request('POST', url, data, config, delay, timeout, rateLimitDuration);
    }
    async put(url, data, config = {}, delay = 0, timeout = 1000, rateLimitDuration = 60000) {
        return this.request('PUT', url, data, config, delay, timeout, rateLimitDuration);
    }
    async delete(url, config = {}, delay = 0, timeout = 1000, rateLimitDuration = 60000) {
        return this.request('DELETE', url, null, config, delay, timeout, rateLimitDuration);
    }
};
exports.HttpService = HttpService;
exports.HttpService = HttpService = HttpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HttpService);
//# sourceMappingURL=http.service.js.map