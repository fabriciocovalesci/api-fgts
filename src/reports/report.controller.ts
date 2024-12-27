import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ReportService } from './report.service';
import { Report } from './report.schema';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async create(@Body() reportData: Partial<Report>): Promise<Report> {
    return this.reportService.create(reportData);
  }

  @Get()
  async findAll(): Promise<Report[]> {
    return this.reportService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Report> {
    return this.reportService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<Report>): Promise<Report> {
    return this.reportService.update(id, updateData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.reportService.delete(id);
    return { message: `Report with ID ${id} has been deleted` };
  }
}
