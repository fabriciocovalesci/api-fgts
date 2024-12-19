import { Module } from '@nestjs/common';
import { ExternalApiService } from './external-api.service';
import { HttpModule } from 'src/http/http.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  providers: [ExternalApiService],
  imports: [HttpModule, ConfigModule], 
  exports: [ExternalApiService],
})
export class ExternalApiModule {}
