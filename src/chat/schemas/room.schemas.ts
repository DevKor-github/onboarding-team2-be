import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema()
export class Room {
  @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
  participants: Types.ObjectId[];

  @Prop({ default: null })
  name: string;

  @Prop({ default: false })
  isGroup: boolean;

  @Prop({ type: [String] })
  @IsString()
  tags: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
