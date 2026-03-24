import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('product-image')
  @ApiOperation({ summary: 'Upload single product image (Admin/Staff only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadImage(file);

    return {
      message: 'Image uploaded successfully',
      url: result.url,
      deleteUrl: result.deleteUrl,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('product-images')
  @ApiOperation({ summary: 'Upload multiple product images (Admin/Staff only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  async uploadProductImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPromises = files.map(file => this.uploadService.uploadImage(file));
    const results = await Promise.all(uploadPromises);

    const uploadedFiles = results.map((result, index) => ({
      url: result.url,
      deleteUrl: result.deleteUrl,
      size: files[index].size,
      mimetype: files[index].mimetype,
    }));

    return {
      message: `${files.length} image(s) uploaded successfully`,
      files: uploadedFiles,
    };
  }

  @Post('category-image')
  @ApiOperation({ summary: 'Upload single category image (Admin/Staff only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadImage(file);

    return {
      message: 'Image uploaded successfully',
      url: result.url,
      deleteUrl: result.deleteUrl,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('variant-image')
  @ApiOperation({ summary: 'Upload single variant image (Admin/Staff only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadVariantImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadImage(file);

    return {
      message: 'Image uploaded successfully',
      url: result.url,
      deleteUrl: result.deleteUrl,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('testimonial-video')
  @ApiOperation({ summary: 'Upload testimonial video (Admin/Staff only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size (max 20MB)' })
  @UseInterceptors(FileInterceptor('video', {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(mp4|webm|ogg|mov|avi)$/)) {
        return callback(new BadRequestException('Only video files are allowed (mp4, webm, ogg, mov, avi)'), false);
      }
      callback(null, true);
    },
  }))
  async uploadTestimonialVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadVideo(file);

    return {
      message: 'Video uploaded successfully',
      url: result.url,
      deleteUrl: result.deleteUrl,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Delete uploaded image (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  async deleteImage(@Param('filename') filename: string) {
    await this.uploadService.deleteFile(filename);
    return { message: 'Image deleted successfully' };
  }
}
