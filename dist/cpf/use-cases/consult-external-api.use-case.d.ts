import { HttpService } from '@nestjs/axios';
export declare class ConsultExternalApiUseCase {
    private readonly httpService;
    constructor(httpService: HttpService);
    execute(cpfList: string[], delay: number, timeout: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any[]>;
}
