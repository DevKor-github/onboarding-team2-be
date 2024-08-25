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

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ type: Map, of: Types.ObjectId }) // 사용자별로 마지막 읽은 메시지 ID를 저장
  lastReadMessage: Map<string, Types.ObjectId>; // <사용자 ID, 메세지 ID>
}

export const RoomSchema = SchemaFactory.createForClass(Room);
