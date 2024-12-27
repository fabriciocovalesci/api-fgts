import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Report extends Document {
  @Prop({ required: true, unique: true, match: /^\d{11}$/ })
  cpf: string;

  @Prop({ type: String, required: false })
  message?: string;

  @Prop({ type: Boolean, default: false })
  greenClient: boolean;

  @Prop({ type: Boolean, default: false })
  yellowClient: boolean;

  @Prop({ type: Boolean, default: false })
  redClient: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

