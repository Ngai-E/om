import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTestimonialDto {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateTestimonialDto {
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTestimonialDto, tenantId?: string) {
    return this.prisma.testimonial.create({
      data: {
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder || 0,
        ...(tenantId && { tenantId }),
      },
    });
  }

  async findAll(tenantId?: string) {
    const where: any = tenantId ? { tenantId } : {};
    return this.prisma.testimonial.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findActive(tenantId?: string) {
    return this.prisma.testimonial.findMany({
      where: { isActive: true, ...(tenantId && { tenantId }) },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 10, // Limit to 10 active testimonials
    });
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return testimonial;
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    const testimonial = await this.findOne(id);

    return this.prisma.testimonial.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const testimonial = await this.findOne(id);

    await this.prisma.testimonial.delete({
      where: { id },
    });

    return { message: 'Testimonial deleted successfully' };
  }

  async toggleActive(id: string) {
    const testimonial = await this.findOne(id);

    return this.prisma.testimonial.update({
      where: { id },
      data: { isActive: !testimonial.isActive },
    });
  }
}
