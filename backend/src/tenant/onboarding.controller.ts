import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { TenantSignupDto } from './dto/tenant-signup.dto';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a new store (tenant + admin user + trial)' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 409, description: 'Slug or email already taken' })
  async signup(@Body() dto: TenantSignupDto) {
    return this.onboardingService.signup(dto);
  }

  @Get('check-slug')
  @ApiOperation({ summary: 'Check if a store slug is available' })
  @ApiQuery({ name: 'slug', required: true })
  @ApiResponse({ status: 200, description: 'Slug availability check' })
  async checkSlug(@Query('slug') slug: string) {
    if (!slug || slug.length < 3) {
      throw new BadRequestException('Slug must be at least 3 characters');
    }
    return this.onboardingService.checkSlugAvailability(slug);
  }
}
