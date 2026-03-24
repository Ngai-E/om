import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReviewDto, ApproveReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new review (Customer only)
   */
  async createReview(userId: string, dto: CreateReviewDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId: dto.productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Verify purchase if orderId provided
    let isVerifiedPurchase = false;
    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: dto.orderId,
          userId,
          items: {
            some: {
              productId: dto.productId,
            },
          },
        },
      });

      if (!order) {
        throw new BadRequestException('Order not found or does not contain this product');
      }

      isVerifiedPurchase = true;
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        orderId: dto.orderId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        isVerifiedPurchase,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      userId,
      action: 'REVIEW_CREATED',
      entity: 'Review',
      entityId: review.id,
      changes: {
        productId: dto.productId,
        rating: dto.rating,
        isVerifiedPurchase,
      },
    });

    return review;
  }

  /**
   * Get reviews for a product (approved only for public)
   */
  async getProductReviews(productId: string, includeAll = false) {
    const where: any = { productId };
    
    if (!includeAll) {
      where.status = 'APPROVED';
    }

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating
    const stats = await this.prisma.review.aggregate({
      where: {
        productId,
        status: 'APPROVED',
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      reviews,
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
      },
    };
  }

  /**
   * Get user's own reviews
   */
  async getUserReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get approved reviews for homepage display (Public)
   */
  async getHomepageReviews() {
    return this.prisma.review.findMany({
      where: {
        status: 'APPROVED',
        showOnHomepage: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 most recent
    });
  }

  /**
   * Get all pending reviews (Admin/Staff only)
   */
  async getPendingReviews() {
    return this.prisma.review.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get all reviews with filters (Admin/Staff only)
   */
  async getAllReviews(status?: string) {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    return this.prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Approve a review (Admin/Staff only)
   */
  async approveReview(reviewId: string, adminUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status === 'APPROVED') {
      throw new BadRequestException('Review is already approved');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'APPROVED',
        approvedBy: adminUserId,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      userId: adminUserId,
      action: 'REVIEW_APPROVED',
      entity: 'Review',
      entityId: reviewId,
      changes: {
        reviewerId: review.userId,
        productId: review.productId,
        rating: review.rating,
      },
    });

    return updatedReview;
  }

  /**
   * Reject a review (Admin/Staff only)
   */
  async rejectReview(reviewId: string, adminUserId: string, dto: ApproveReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status === 'REJECTED') {
      throw new BadRequestException('Review is already rejected');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        rejectedBy: adminUserId,
        rejectedAt: new Date(),
        rejectionReason: dto.rejectionReason,
        approvedBy: null,
        approvedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      userId: adminUserId,
      action: 'REVIEW_REJECTED',
      entity: 'Review',
      entityId: reviewId,
      changes: {
        reviewerId: review.userId,
        productId: review.productId,
        rating: review.rating,
        rejectionReason: dto.rejectionReason,
      },
    });

    return updatedReview;
  }

  /**
   * Toggle homepage display for a review (Admin/Staff only)
   */
  async toggleHomepageDisplay(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status !== 'APPROVED') {
      throw new BadRequestException('Only approved reviews can be featured on homepage');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        showOnHomepage: !review.showOnHomepage,
      },
    });
  }

  /**
   * Delete a review (Admin only or own review)
   */
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only admin or review owner can delete
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    // Audit log
    await this.auditService.log({
      userId,
      action: 'REVIEW_DELETED',
      entity: 'Review',
      entityId: reviewId,
      changes: {
        reviewerId: review.userId,
        productId: review.productId,
        deletedBy: userId,
      },
    });

    return { message: 'Review deleted successfully' };
  }
}
