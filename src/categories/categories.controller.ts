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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { Category } from './category.entity';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto): Promise<Category> {
    return this.service.create(user.id, dto);
  }
  @Get() list(@CurrentUser() user: AuthUser): Promise<Category[]> {
    return this.service.list(user.id);
  }
  @Get(':id') get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Category> {
    return this.service.get(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.service.update(user.id, id, dto);
  }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.remove(user.id, id);
  }
}
