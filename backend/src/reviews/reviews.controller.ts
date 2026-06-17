import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { TriggerReviewDto } from './dto/trigger-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('projects/:projectId/reviews/trigger')
  async triggerReview(
    @Param('projectId') projectId: string,
    @Body() triggerDto: TriggerReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.triggerReview(projectId, triggerDto, req.user.id);
  }

  @Get('projects/:projectId/reviews')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('search') search: string,
    @Req() req: any,
  ) {
    return this.reviewsService.findAll(projectId, search, req.user.id);
  }

  @Get('reviews/history')
  async getGlobalHistory(@Query('search') search: string, @Req() req: any) {
    return this.reviewsService.getGlobalHistory(search, req.user.id);
  }

  @Get('reviews/:id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.findOne(id, req.user.id);
  }
}
