import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from 'src/http/http.service';

@Injectable()
export class ExternalApiService {
  private enpoint: string;
  private readonly logger = new Logger(ExternalApiService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.enpoint = this.configService.get('BASE_URL')
  }


  private config(timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number) {
    return {
      timeout: timeout,
      delay: delay,
      rateLimitPoints: rateLimitPoints,
      rateLimitDuration: rateLimitDuration
    };
  }


  public async getProducts(timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any> {
    this.logger.log('Searching for products');
    const products = await this.httpService.get(
      false,
      `${this.enpoint}/v1/Product`,
      this.config(timeout, delay, rateLimitPoints, rateLimitDuration),
      delay,
      timeout
    );

    this.logger.log('Products found');
    return products.data;
  }


  public async getProductByNames(productName: string, timeout: number, delay: number, rateLimitPoints: number, rateLimitDuration: number): Promise<any> {
    this.logger.log(`Searching for product ${productName}`);
    const listProducts = await this.httpService.get(
      false,
      `${this.enpoint}/v1/Product`,
      this.config(timeout, delay, rateLimitPoints, rateLimitDuration),
      delay,
      timeout
    );

    const product = listProducts?.data.find((product: any) => product.name === productName);
    if (!product) {
      this.logger.error(`Product ${productName} not found`);
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    this.logger.log(`Product ${productName} found`);
    return {
      id: product.id,
      minimumInterestRate: product.minimumInterestRate
    }
  }


  /**
   * Simulates FGTS for a given CPF and product name.
   *
   * This method will search for the product by name and then simulate the FGTS using the product's minimum interest rate.
   * If the product is not found, a 404 error will be thrown.
   * If the simulation fails for any other reason, the error will be caught and returned in the response body.
   *
   * @param productName The name of the product to simulate the FGTS for.
   * @param cpf The CPF of the person to simulate the FGTS for.
   * @param timeout The timeout for the request in milliseconds.
   * @param delay The delay between requests in milliseconds.
   * @param rateLimitPoints The number of points in the rate limit.
   * @param rateLimitDuration The duration of the rate limit in milliseconds.
   * @returns A Promise that resolves to the simulation result.
   */
  public async simulationFGTS(
    productName: string, 
    cpf: string, 
    timeout: number, 
    delay: number, 
    rateLimitPoints: number, 
    rateLimitDuration: number
  ): Promise<any> {
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
  
      const simulation = await this.httpService.post(
        true,
        `${this.enpoint}/v1/Amortization`,
        data,
        this.config(timeout, delay, rateLimitPoints, rateLimitDuration),
        delay,
        timeout,
        rateLimitDuration
      );
  
      this.logger.log(`Simulation FGTS for CPF ${cpf} completed successfully`);
      return simulation;
    } catch (error) {

      const errorMessage = error.response.message
      this.logger.error(`Error during FGTS simulation for CPF ${cpf}: ${errorMessage}`, error.stack);
  
      return {
        cpf,
        error: true,
        message: errorMessage,
        statusCode: error.response?.code || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
  
  public async simulationBatchFGTS(
    minimumInterestRate: number,
    productId: string,
    cpfs: string[], 
    timeout: number, 
    delay: number, 
    rateLimitPoints: number, 
    rateLimitDuration: number
  ): Promise<any> {
    this.logger.log(`Simulating FGTS for CPF: ${cpfs.length}`);
  
    try {  
      const batchData = cpfs.map((cpf) => ({
        amortization: {
          agentCommission: {
            amount: 0,
            type: "Percentage",
            baseValue: "InitialValue",
          },
          apr: minimumInterestRate,
          termInMonths: 5,
          startDate: new Date().toISOString(),
          requestedAmount: 0,
          amortizationType: "fgts",
        },
        registrationNumber: cpf,
        personId: null,
        legalPerson: false,
        productId: productId,
      }));
  
  
      const simulation = await this.httpService.post(
        true,
        `${this.enpoint}/v1/Amortization/BatchSimulation`,
        batchData,
        this.config(timeout, delay, rateLimitPoints, rateLimitDuration),
        delay,
        timeout,
        rateLimitDuration
      );
  
      this.logger.log(`Simulation FGTS for CPF ${batchData.length} completed successfully`);
      return simulation;
    } catch (error) {

      const errorMessage = error.response.message;
      this.logger.error(`Error during FGTS simulation for CPF : ${errorMessage}`, error.stack);
  
      return {
        cpfs,
        error: true,
        message: errorMessage,
        statusCode: error.response?.code || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
  

}
