import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CpfService } from '../cpf/cpf.service';
import { Response } from 'express';
import { toZonedTime } from 'date-fns-tz';
import { ReportService } from 'src/reports/report.service';
import { Report } from 'src/reports/report.schema';

@Injectable()
export class ScheduleInterceptor implements NestInterceptor {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cpfService: CpfService,
    private readonly reportService: ReportService, 
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const { schedule, cpfList, delay, timeout, rateLimitPoints, rateLimitDuration, productId, teimosinha, traceId } = request.body;


    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    if (schedule) {
      const { startDate, endDate } = schedule;

      if (!startDate) {
        throw new BadRequestException('Data de início é obrigatória');
      }

      const startTime = this.convertToLocalTime(startDate);
      const endTime = endDate ? this.convertToLocalTime(endDate) : null;

      if (isNaN(startTime.getTime()) || (endTime && isNaN(endTime.getTime()))) {
        throw new BadRequestException('Data de início ou fim inválida');
      }

      const now = new Date();
      const nowLocal = toZonedTime(now, 'America/Sao_Paulo');

      // if (startTime.getTime() < nowLocal.getTime()) {
      //   throw new BadRequestException(`A data de início não pode estar no passado: ${startDate} ${nowLocal.toISOString()}`);
      // }

      const timeUntilExecution = startTime.getTime() - Date.now();
      const timeoutId = `schedule-${startTime.toISOString()}`;
      const results = [];

      response.json({
        message: "Consulta agendada com sucesso!", 
        scheduledFor: startDate, 
        traceId: traceId
      });

      this.schedulerRegistry.addTimeout(
        timeoutId,
        setTimeout(async () => {
          console.log(`Executando tarefa agendada para ${startDate}`);

          await this.cpfService.processCpfListAndConsultExternalApi(
            cpfList,
            delay,
            timeout,
            rateLimitPoints,
            rateLimitDuration,
            productId,
            teimosinha,
            async (cpf, result) => {
              const existsData = await this.reportService.findOneByTraceId(traceId);
              if (existsData) {
                await this.reportService.update(traceId, result);
              } else {
                const reportData: Partial<Report> = {
                  traceId: traceId,
                  result: [result]
                };
                await this.reportService.create(reportData);
              }
              response.write(`data: ${JSON.stringify({ result })}\n\n`);
            }
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
        }, timeUntilExecution),
      );

      console.log(`Tarefa agendada para ${startDate}`);
      if (endTime) {
        console.log(`A tarefa terminará em ${endDate}`);
      }
      return new Observable(subscriber => {
        subscriber.next();
        subscriber.complete();
      });
    }

    return next.handle();
  }

  private convertToLocalTime(dateString: string): Date {
    const timeZone = 'America/Sao_Paulo';
    const date = new Date(dateString);
    return toZonedTime(date, timeZone);
  }
}
