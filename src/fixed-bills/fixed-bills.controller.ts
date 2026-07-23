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
import { CreateFixedBillDto, FixedBillQueryDto, UpdateFixedBillDto } from './fixed-bill.dto';
import { FixedBill } from './fixed-bill.entity';
import { FixedBillsService } from './fixed-bills.service';
@ApiTags('fixed-bills')
@ApiBearerAuth()
@Controller('fixed-bills')
export class FixedBillsController {
  constructor(private readonly service: FixedBillsService) {}

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() d: CreateFixedBillDto): Promise<FixedBill> {
    return this.service.create(u.id, d);
  }

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: FixedBillQueryDto): Promise<Page<FixedBill>> {
    return this.service.list(u.id, q);
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<FixedBill> {
    return this.service.get(u.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: UpdateFixedBillDto,
  ): Promise<FixedBill> {
    return this.service.update(u.id, id, d);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(u.id, id);
  }
}
