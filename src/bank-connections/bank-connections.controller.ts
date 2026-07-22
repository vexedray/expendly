import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateBankConnectionDto } from './bank-connection.dto';
import { BankConnection } from './bank-connection.entity';
import { BankConnectionsService } from './bank-connections.service';
import { ConnectToken } from './open-finance.provider';

@ApiTags('open-finance')
@ApiBearerAuth()
@Controller('open-finance')
export class BankConnectionsController {
  constructor(private readonly service: BankConnectionsService) {}
  @Post('connect-token') connectToken(@CurrentUser() user: AuthUser): Promise<ConnectToken> {
    return this.service.connectToken(user.id);
  }
  @Post('items') create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBankConnectionDto,
  ): Promise<BankConnection> {
    return this.service.create(user.id, dto);
  }
  @Get('items') list(@CurrentUser() user: AuthUser): Promise<BankConnection[]> {
    return this.service.list(user.id);
  }
  @Get('items/:id') get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BankConnection> {
    return this.service.get(user.id, id);
  }
  @Delete('items/:id') @HttpCode(HttpStatus.NO_CONTENT) disconnect(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.disconnect(user.id, id);
  }
}
