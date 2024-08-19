import { Types } from 'mongoose';

export class MarkAsReadAndUnreadMessagesReqDto {
  roomId: Types.ObjectId;
  lastMessageId: Types.ObjectId;
  limit: number;
}
