import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    BadRequestException,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { SchedulerRegistry } from '@nestjs/schedule';
  
  @Injectable()
  export class ScheduleInterceptor implements NestInterceptor {
    constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { schedule } = request.body;
  
      if (schedule) {
        const { startDate, endDate } = schedule;
  
        if (!startDate) {
          throw new BadRequestException('StartDate is required');
        }
  
        const startTime = new Date(startDate);
        const endTime = endDate ? new Date(endDate) : null;
  
        if (isNaN(startTime.getTime()) || (endTime && isNaN(endTime.getTime()))) {
          throw new BadRequestException('Invalid startDate or endDate');
        }
  
        if (startTime < new Date()) {
          throw new BadRequestException('StartDate cannot be in the past');
        }
  
        const timeUntilExecution = startTime.getTime() - Date.now();
        this.schedulerRegistry.addTimeout(
          `schedule-${startTime.toISOString()}`,
          setTimeout(() => {
            console.log(`Executing task scheduled for ${startDate}`);
            // Chame aqui a lógica do serviço que processa o CPF.
            // Exemplo: this.service.executeTask();
          }, timeUntilExecution),
        );
  
        console.log(`Task scheduled for ${startDate}`);
        if (endTime) {
          console.log(`Task will end at ${endDate}`);
        }
  
        // Retorna uma mensagem indicando que o agendamento foi bem-sucedido.
        return next
          .handle()
          .pipe(
            tap(() =>
              console.log(
                `Task successfully scheduled to run at ${startDate}`,
              ),
            ),
          );
      }
  
      return next.handle();
    }
  }
  