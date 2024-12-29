import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from './report.schema';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private readonly reportModel: Model<Report>) {}

  async create(reportData: Partial<Report>): Promise<Report> {
    const report = new this.reportModel(reportData);
    return report.save();
  }

  async findAll(): Promise<Report[]> {
    return this.reportModel.find().exec();
  }

  async findById(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async findOneByTraceId(traceId: string): Promise<Report | null> {
    return await this.reportModel.findOne({ traceId: traceId });
  }
  

  async update(traceId: string, newResult: Partial<Report>): Promise<Report | null> {
    return await this.reportModel.findOneAndUpdate(
      { traceId: traceId },
      { $push: { result: newResult } }, 
      { new: true } 
    );
  }
  
  

  async delete(id: string): Promise<void> {
    const result = await this.reportModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }
}
