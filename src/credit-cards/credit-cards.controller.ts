import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Page } from '../common/dto/page-query.dto';
import { CreateCreditCardDto, CreditCardQueryDto, UpdateCreditCardDto } from './credit-card.dto';
import { CreditCard } from './credit-card.entity';
import { CreditCardsService } from './credit-cards.service';
@ApiTags('credit-cards')
@ApiBearerAuth()
@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly service: CreditCardsService) {}

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() d: CreateCreditCardDto): Promise<CreditCard> {
    return this.service.create(u.id, d);
  }

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: CreditCardQueryDto): Promise<Page<CreditCard>> {
    return this.service.list(u.id, q);
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<CreditCard> {
    return this.service.get(u.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: UpdateCreditCardDto,
  ): Promise<CreditCard> {
    return this.service.update(u.id, id, d);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(u.id, id);
  }
}
