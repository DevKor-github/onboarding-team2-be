import { IsString } from 'class-validator';

export class LoginUserDto {
  @IsString()
  readonly user_id: string;

  @IsString()
  readonly password: string;
}
