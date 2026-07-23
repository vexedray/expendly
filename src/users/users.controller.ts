import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth-user.interface';
import { PublicUser } from '../auth/auth.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateMeDto } from './user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() auth: AuthUser): Promise<PublicUser> {
    return this.users.me(auth.id);
  }

  @Patch('me')
  update(@CurrentUser() auth: AuthUser, @Body() dto: UpdateMeDto): Promise<PublicUser> {
    return this.users.update(auth.id, dto);
  }
}
