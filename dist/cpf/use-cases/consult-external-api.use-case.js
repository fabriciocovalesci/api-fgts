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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultExternalApiUseCase = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
let ConsultExternalApiUseCase = class ConsultExternalApiUseCase {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async execute(cpfList, delay, timeout, rateLimitPoints, rateLimitDuration) {
        const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
            points: rateLimitPoints,
            duration: rateLimitDuration,
        });
        try {
            await rateLimiter.consume('user', 1);
            const results = await Promise.all(cpfList.map(async (cpf) => {
                const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post('https://api.externa.com/consultar', { cpf }, {
                    timeout,
                    headers: { Authorization: 'Bearer <TOKEN_DE_ACESSO>' },
                }));
                return response.data;
            }));
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return results;
        }
        catch (error) {
            throw new common_1.HttpException('Erro ao consultar a API externa', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ConsultExternalApiUseCase = ConsultExternalApiUseCase;
exports.ConsultExternalApiUseCase = ConsultExternalApiUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ConsultExternalApiUseCase);
//# sourceMappingURL=consult-external-api.use-case.js.map