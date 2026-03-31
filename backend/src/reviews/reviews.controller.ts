import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ApproveReviewDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product review (Customer only)' })
  @ApiResponse({ status: 201, description: 'Review created (pending approval)' })
  @ApiResponse({ status: 400, description: 'Validation failed or already reviewed' })
  async createReview(@Req() req: Request, @CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto, (req as any).tenantId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reviews (Customer only)' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved' })
  async getMyReviews(@CurrentUser() user: any) {
    return this.reviewsService.getUserReviews(user.id);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review (Customer) or any review (Admin)' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this review' })
  async deleteReview(@CurrentUser() user: any, @Param('reviewId') reviewId: string) {
    const isAdmin = user.role === 'ADMIN';
    return this.reviewsService.deleteReview(reviewId, user.id, isAdmin);
  }

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get approved reviews for a product (Public)' })
  @ApiResponse({ status: 200, description: 'Product reviews retrieved' })
  async getProductReviews(@Req() req: Request, @Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId, false, (req as any).tenantId);
  }

  @Get('homepage')
  @ApiOperation({ summary: 'Get approved reviews for homepage display (Public)' })
  @ApiResponse({ status: 200, description: 'Homepage reviews retrieved' })
  async getHomepageReviews(@Req() req: Request) {
    return this.reviewsService.getHomepageReviews((req as any).tenantId);
  }

  // ============================================
  // ADMIN/STAFF ENDPOINTS
  // ============================================

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending reviews (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending reviews retrieved' })
  async getPendingReviews(@Req() req: Request) {
    return this.reviewsService.getPendingReviews((req as any).tenantId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reviews with optional status filter (Staff/Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiResponse({ status: 200, description: 'All reviews retrieved' })
  async getAllReviews(@Req() req: Request, @Query('status') status?: string) {
    return this.reviewsService.getAllReviews(status, (req as any).tenantId);
  }

  @Patch(':reviewId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Review approved' })
  @ApiResponse({ status: 400, description: 'Review already approved' })
  async approveReview(@CurrentUser() user: any, @Param('reviewId') reviewId: string) {
    return this.reviewsService.approveReview(reviewId, user.id);
  }

  @Patch(':reviewId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a review (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Review rejected' })
  @ApiResponse({ status: 400, description: 'Review already rejected' })
  async rejectReview(
    @CurrentUser() user: any,
    @Param('reviewId') reviewId: string,
    @Body() dto: ApproveReviewDto,
  ) {
    return this.reviewsService.rejectReview(reviewId, user.id, dto);
  }

  @Patch(':reviewId/toggle-homepage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle review homepage display (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Homepage display toggled' })
  async toggleHomepageDisplay(@Param('reviewId') reviewId: string) {
    return this.reviewsService.toggleHomepageDisplay(reviewId);
  }
}
