import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  @IsString()
  @IsNotEmpty()
  userId: string; // 로그인할 때의 아이디

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  password: string; // 비밀번호

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  username: string; // 닉네임

  @Prop({ required: true, default: false })
  @IsBoolean()
  status: boolean; // 사용정지 여부

  @Prop({ type: [String] })
  @IsString()
  tags: string[]; // 사용자 태그

  @Prop({ required: true, default: Date.now })
  @IsDate()
  createdAt: Date; // 생성 날짜
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('pw')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
