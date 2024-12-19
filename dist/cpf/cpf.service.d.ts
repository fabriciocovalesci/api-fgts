import { ValidateCpfListUseCase } from './use-cases/validate-cpf-list.use-case';
import { ConfigService } from '@nestjs/config';
import { ExternalApiService } from 'src/external-api/external-api.service';
export declare class CpfService {
    private readonly validateCpfListUseCase;
    private readonly configService;
    private readonly consultSimulation;
    enpoint: string;
    private readonly logger;
    constructor(validateCpfListUseCase: ValidateCpfListUseCase, configService: ConfigService, consultSimulation: ExternalApiService);
    private saveToCsv;
    getProductsExternalApi(timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any>;
    processCpfListAndConsultExternalApi(cpfList: string[], delay: number, timeout: number, rateLimitPoints: number, rateLimitDuration: number, productName: string): Promise<any[]>;
    processCpfBatchAndConsultExternalApi(): Promise<void>;
}
