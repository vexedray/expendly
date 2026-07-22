import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Page } from '../common/dto/page-query.dto';
import { TransactionQueryDto, UpdateTransactionDto } from './transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';
@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}
  @Get() list(
    @CurrentUser() u: AuthUser,
    @Query() q: TransactionQueryDto,
  ): Promise<Page<Transaction>> {
    return this.service.list(u.id, q);
  }
  @Get(':id') get(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    return this.service.get(u.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.service.update(u.id, id, d);
  }
}
