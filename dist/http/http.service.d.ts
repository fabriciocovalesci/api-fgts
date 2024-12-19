import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
export declare class HttpService {
    private readonly configService;
    private jwtToken;
    private basicAuthToken;
    private requestCount;
    private readonly logger;
    constructor(configService: ConfigService);
    private authenticate;
    private delay;
    private rateLimitedRequest;
    request(method: string, url: string, data?: any, config?: AxiosRequestConfig, delay?: number, timeout?: number, rateLimitDuration?: number): Promise<any>;
    get(url: string, config?: AxiosRequestConfig, delay?: number, timeout?: number, rateLimitDuration?: number): Promise<any>;
    post(url: string, data: any, config?: AxiosRequestConfig, delay?: number, timeout?: number, rateLimitDuration?: number): Promise<any>;
    put(url: string, data: any, config?: AxiosRequestConfig, delay?: number, timeout?: number, rateLimitDuration?: number): Promise<any>;
    delete(url: string, config?: AxiosRequestConfig, delay?: number, timeout?: number, rateLimitDuration?: number): Promise<any>;
}
