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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CpfController = void 0;
const common_1 = require("@nestjs/common");
const cpf_service_1 = require("./cpf.service");
const request_dto_1 = require("./dto/request.dto");
const path = require("path");
const fs = require("fs");
const platform_express_1 = require("@nestjs/platform-express");
const csvParser = require("csv-parser");
let CpfController = class CpfController {
    constructor(cpfService) {
        this.cpfService = cpfService;
    }
    async listProdudts(requestDto) {
        return await this.cpfService.getProductsExternalApi(requestDto.delay, requestDto.timeout, requestDto.rateLimitPoints, requestDto.rateLimitDuration);
    }
    async consultarCpf(requestDto) {
        return await this.cpfService.processCpfListAndConsultExternalApi(requestDto.cpfList, requestDto.delay, requestDto.timeout, requestDto.rateLimitPoints, requestDto.rateLimitDuration, requestDto.productName);
    }
    async consultarCpfBatch(file, requestDto) {
        if (!file) {
            throw new Error('File is required');
        }
        const cpfs = await this.parseCsv(file);
        return await this.cpfService.processCpfBatchAndConsultExternalApi();
    }
    async parseCsv(file) {
        return new Promise((resolve, reject) => {
            const cpfs = [];
            const stream = fs.createReadStream(file.path)
                .pipe(csvParser())
                .on('data', (row) => {
                if (row.cpf) {
                    cpfs.push(row.cpf);
                }
            })
                .on('end', () => {
                resolve(cpfs);
            })
                .on('error', (error) => {
                reject(error);
            });
        });
    }
    async downloadCsv(fileName, res) {
        const filePath = path.join(__dirname, '../../exports', fileName);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        }
        else {
            res.status(404).send('Arquivo não encontrado');
        }
    }
};
exports.CpfController = CpfController;
__decorate([
    (0, common_1.Post)('produtos'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_dto_1.RequestDto]),
    __metadata("design:returntype", Promise)
], CpfController.prototype, "listProdudts", null);
__decorate([
    (0, common_1.Post)('consultar-cpf'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_dto_1.RequestDto]),
    __metadata("design:returntype", Promise)
], CpfController.prototype, "consultarCpf", null);
__decorate([
    (0, common_1.Post)('consultar-batch'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, request_dto_1.RequestDto]),
    __metadata("design:returntype", Promise)
], CpfController.prototype, "consultarCpfBatch", null);
__decorate([
    (0, common_1.Get)('download-csv/:fileName'),
    __param(0, (0, common_1.Param)('fileName')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CpfController.prototype, "downloadCsv", null);
exports.CpfController = CpfController = __decorate([
    (0, common_1.Controller)('fgts'),
    __metadata("design:paramtypes", [cpf_service_1.CpfService])
], CpfController);
//# sourceMappingURL=cpf.controller.js.map