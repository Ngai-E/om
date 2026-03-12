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
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const baseUrl = process.env.API_URL || 'http://localhost:4000';
    const url = this.uploadService.getFileUrl(file.filename, baseUrl);

    return {
      message: 'Image uploaded successfully',
      filename: file.filename,
      url,
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
  uploadProductImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const baseUrl = process.env.API_URL || 'http://localhost:4000';
    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filename, baseUrl),
      size: file.size,
      mimetype: file.mimetype,
    }));

    return {
      message: `${files.length} image(s) uploaded successfully`,
      files: uploadedFiles,
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
