import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Report extends Document {
  @Prop({ type: String, unique: true })
  traceId: string;

  @Prop({ type: Object })
  result: Record<string, any>;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

