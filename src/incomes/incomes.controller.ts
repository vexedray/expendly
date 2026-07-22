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
import { CreateIncomeDto, IncomeQueryDto, UpdateIncomeDto } from './income.dto';
import { Income } from './income.entity';
import { IncomesService } from './incomes.service';
@ApiTags('income')
@ApiBearerAuth()
@Controller('income')
export class IncomesController {
  constructor(private readonly service: IncomesService) {}
  @Post() create(@CurrentUser() u: AuthUser, @Body() d: CreateIncomeDto): Promise<Income> {
    return this.service.create(u.id, d);
  }
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: IncomeQueryDto): Promise<Page<Income>> {
    return this.service.list(u.id, q);
  }
  @Get(':id') get(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Income> {
    return this.service.get(u.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: UpdateIncomeDto,
  ): Promise<Income> {
    return this.service.update(u.id, id, d);
  }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.remove(u.id, id);
  }
}
