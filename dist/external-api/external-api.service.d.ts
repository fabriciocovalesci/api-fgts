import { ConfigService } from '@nestjs/config';
import { HttpService } from 'src/http/http.service';
export declare class ExternalApiService {
    private readonly httpService;
    private readonly configService;
    private enpoint;
    private readonly logger;
    constructor(httpService: HttpService, configService: ConfigService);
    private config;
    getProducts(timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any>;
    getProductByNames(productName: string, timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any>;
    simulationFGTS(productName: string, cpf: string, timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any>;
}
