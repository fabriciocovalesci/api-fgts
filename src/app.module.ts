import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import axios from 'axios';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import config from './config/config';
import { CpfModule } from './cpf/cpf.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { HttpService } from './http/http.service';
import { HttpModule } from './http/http.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportModule } from './reports/report.module';
import { InterceptorsModule } from './interceptors/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config], 
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.CONNECTION_STRING,
      }),
    }),
    AuthModule, 
    UsersModule,
    HttpModule,
    CpfModule,
    ReportModule,
    InterceptorsModule,
    ExternalApiModule
  ],
  controllers: [],
  providers: [
      HttpService,
      {
        provide: 'AXIOS_INSTANCE', 
        useValue: axios, 
      },
    AppService
  ],
})
export class AppModule {}
