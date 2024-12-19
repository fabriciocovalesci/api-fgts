import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpService {
  private jwtToken: string | null = null;
  private basicAuthToken: string;
  private requestCount = 0; 
  private readonly logger = new Logger(HttpService.name);

  constructor(private readonly configService: ConfigService) {
    this.basicAuthToken = this.configService.get<string>('BASIC_AUTH_TOKEN');
  }

  private async authenticate(): Promise<void> {
    this.logger.log('Autenticando');
    if (!this.jwtToken) {
      const authResponse = await axios.post(
        this.configService.get<string>('AUTH_URL'),
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'credit/admin',
        }),
        {
          headers: {
            'Authorization': `Basic ${this.basicAuthToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      this.logger.log('Autenticado com sucesso');
      this.jwtToken = authResponse.data.access_token;
      setTimeout(() => {
        this.jwtToken = null;
      }, authResponse.data.expires_in * 1000); 
    }
    this.logger.log('Autenticado reutilizando token');
  }


  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  private async rateLimitedRequest(enableDelay: boolean, config: AxiosRequestConfig, delay: number = 0, rateLimitDuration: number = 60000) {
    if(enableDelay){
      await this.delay(delay);
    }

    if (this.requestCount >= 10) {
      this.logger.error('Limite de requisições excedido');
      throw new HttpException('Limite de requisições excedido', HttpStatus.TOO_MANY_REQUESTS);
    }

    this.requestCount++;


    setTimeout(() => {
      this.requestCount = 0;
    }, rateLimitDuration);


      try {
        const response = await axios(config);
        return response.data;
      } catch (error) {
        this.logger.error(`Erro ao fazer requisição: ${error.message}`);
        if (error.response) {
        this.logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
        return error.response.data;
        // throw new HttpException(error.response.data, error.response.status);
        } else {
        throw new HttpException('Erro ao fazer requisição', HttpStatus.BAD_GATEWAY);
        }
      }
  }


  public async request(
    enableDelay: boolean,
    method: string,
    url: string,
    data?: any,
    config: AxiosRequestConfig = {},
    delay: number = 0,
    timeout: number = 1000,
    rateLimitDuration: number = 60000
  ): Promise<any> {
    if (!this.jwtToken) {
      await this.authenticate();
    }

    const authorizationHeader = this.jwtToken
      ? `Bearer ${this.jwtToken}`
      : `Basic ${this.basicAuthToken}`;

    const requestConfig: AxiosRequestConfig = {
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
    return this.rateLimitedRequest(enableDelay, requestConfig, delay, rateLimitDuration);
  }


  public async get(enableDelay: boolean, url: string, config: AxiosRequestConfig = {}, delay: number = 0, timeout: number = 1000, rateLimitDuration: number = 60000) {
    return this.request(enableDelay, 'GET', url, null, config, delay, timeout, rateLimitDuration);
  }

  public async post(enableDelay: boolean, url: string, data: any, config: AxiosRequestConfig = {}, delay: number = 0, timeout: number = 1000, rateLimitDuration: number = 60000) {
    return this.request(enableDelay, 'POST', url, data, config, delay, timeout, rateLimitDuration);
  }

  public async put(enableDelay: boolean, url: string, data: any, config: AxiosRequestConfig = {}, delay: number = 0, timeout: number = 1000, rateLimitDuration: number = 60000) {
    return this.request(enableDelay, 'PUT', url, data, config, delay, timeout, rateLimitDuration);
  }

  public async delete(enableDelay: boolean, url: string, config: AxiosRequestConfig = {}, delay: number = 0, timeout: number = 1000, rateLimitDuration: number = 60000) {
    return this.request(enableDelay, 'DELETE', url, null, config, delay, timeout, rateLimitDuration);
  }
}
