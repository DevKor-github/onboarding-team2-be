import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { Room, RoomSchema } from './schemas/room.schemas';
import { ChatGateway } from './gateway/chat.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  providers: [ChatService, ChatGateway, JwtService],
  controllers: [ChatController],
})
export class ChatModule {}
