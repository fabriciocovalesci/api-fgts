import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CpfService } from '../cpf/cpf.service';
import { Response } from 'express';
import { toZonedTime } from 'date-fns-tz';
import { ReportService } from 'src/reports/report.service';
import { Report } from 'src/reports/report.schema';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class ScheduleBatchInterceptor implements NestInterceptor {
    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly cpfService: CpfService,
        private readonly reportService: ReportService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response: Response = context.switchToHttp().getResponse();
        const {
            startDate,
            endDate,
            delay,
            batchSize,
            timeout,
            rateLimitPoints,
            rateLimitDuration,
            productId,
            teimosinha,
            traceId,
        } = request.body;
        const file = request.file;

        if (!file) {
            throw new BadRequestException('Arquivo CSV é obrigatório.');
        }

        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');

        if (startDate) {
            const startTime = this.convertToLocalTime(startDate);
            const endTime = endDate ? this.convertToLocalTime(endDate) : null;

            if (isNaN(startTime.getTime()) || (endTime && isNaN(endTime.getTime()))) {
                throw new BadRequestException('Data de início ou fim inválida');
            }

            const now = new Date();
            const nowLocal = toZonedTime(now, 'America/Sao_Paulo');


            console.log('Start Time:', startTime.toISOString());
            console.log('Now Local:', nowLocal.toISOString());
            console.log('Start Time (ms):', startTime.getTime());
            console.log('Now Local (ms):', nowLocal.getTime());


            if (startTime.getTime() < nowLocal.getTime()) {
                throw new BadRequestException(`A data de início não pode estar no passado: Hora informada ${startDate} | Hora atual ${nowLocal.toISOString()}`);
            }

            const timeUntilExecution = startTime.getTime() - Date.now();
            const timeoutId = `schedule-${startTime.toISOString()}`;

            response.json({
                message: "Consulta agendada com sucesso!", 
                scheduledFor: startDate, 
                traceId: traceId
              });

          
            this.schedulerRegistry.addTimeout(
                    timeoutId,
                    setTimeout(async () => {
       
                    const executionFormattedNow = this.formatDate(new Date());
                    console.log(`Executando tarefa agendada para ${startDate} Hora local: ${executionFormattedNow}`);
                    const cpfList = await this.parseCsv(file);

                    await this.cpfService.processCpfBatchAndConsultExternalApi(
                        cpfList,
                        delay,
                        timeout,
                        rateLimitPoints,
                        rateLimitDuration,
                        productId,
                        teimosinha,
                        batchSize,
                        file.originalname,
                        async (result) => {
                            const existsData = await this.reportService.findOneByTraceId(traceId);
                            if (existsData) {
                                await this.reportService.update(traceId, result);
                            } else {
                                const reportData: Partial<Report> = {
                                    traceId: traceId,
                                    result: [result],
                                };
                                await this.reportService.create(reportData);
                            }
                            response.write(`data: ${JSON.stringify({ result })}\n\n`);
                        },
                    );

                    response.end();

                    if (endTime) {
                        const timeUntilEnd = endTime.getTime() - Date.now();
                        if (timeUntilEnd > 0) {
                          this.schedulerRegistry.addTimeout(
                            `end-schedule-${endTime.toISOString()}`,
                            setTimeout(() => {
                              console.log(`Encerrando tarefa agendada para ${endDate}`);
                            }, timeUntilEnd),
                          );
                        }
                      }
                    }, timeUntilExecution)
            );

            console.log(`Tarefa agendada para ${startDate} Hora local: ${Date.now()}`);
            if (endTime) {
                console.log(`A tarefa terminará em ${endDate}`);
            }   

            return new Observable((subscriber) => {
                subscriber.next();
                subscriber.complete();
            });
        }

        return next.handle();
    }

    private convertToLocalTime(dateString: string) {
        const timeZone = 'America/Sao_Paulo';
        const date = new Date(dateString);
        return toZonedTime(date, timeZone);
    }

    private formatDate(date: Date): string {
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    private async parseCsv(file: Express.Multer.File): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const cpfs = new Set<string>();
            Readable.from(file.buffer)
                .pipe(csvParser())
                .on('data', (row) => {
                    if (row.cpf) {
                        const normalizedCpf = /^\d{11}$/.test(row.cpf)
                            ? row.cpf
                            : row.cpf.replace(/\D/g, '');

                        if (/^\d{11}$/.test(normalizedCpf)) {
                            cpfs.add(normalizedCpf);
                        }
                    }
                })
                .on('end', () => {
                    resolve(Array.from(cpfs));
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }
}
