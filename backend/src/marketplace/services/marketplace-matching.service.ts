import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketplaceRequestService } from './marketplace-request.service';

interface MatchCandidate {
  providerId: string;
  score: number;
  reasons: string[];
}

@Injectable()
export class MarketplaceMatchingService {
  private readonly logger = new Logger(MarketplaceMatchingService.name);

  constructor(
    private prisma: PrismaService,
    private requestService: MarketplaceRequestService,
  ) {}

  /**
   * Find and create matches for a marketplace request
   */
  async matchRequest(requestId: string) {
    const request = await this.prisma.marketplaceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    this.logger.log(`Starting matching for request ${requestId}`);

    // Find candidate providers
    const candidates = await this.findCandidateProviders(request);

    this.logger.log(`Found ${candidates.length} candidate providers`);

    // Create match records
    const matches = await Promise.all(
      candidates.map((candidate) =>
        this.createMatch(requestId, candidate),
      ),
    );

    // Update request status and matched count
    await this.requestService.updateRequestStatus(requestId, 'RECEIVING_OFFERS');
    await this.prisma.marketplaceRequest.update({
      where: { id: requestId },
      data: { matchedCount: matches.length },
    });

    this.logger.log(`Created ${matches.length} matches for request ${requestId}`);

    return matches;
  }

  /**
   * Find candidate providers based on request criteria
   */
  private async findCandidateProviders(request: any): Promise<MatchCandidate[]> {
    // Get all active providers
    const providers = await this.prisma.provider.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        categories: true,
        serviceAreas: true,
        tenant: {
          select: {
            status: true,
          },
        },
      },
    });

    const candidates: MatchCandidate[] = [];

    for (const provider of providers) {
      const match = this.scoreProvider(provider, request);
      
      if (match.score > 0) {
        candidates.push(match);
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Return top 20 matches
    return candidates.slice(0, 20);
  }

  /**
   * Score a provider against a request
   * Scoring formula:
   * - Category match: 40 points
   * - City match: 25 points
   * - Country/region match: 10 points
   * - Verified provider: 10 points
   * - Tenant-backed provider: 5 points
   * - Higher rating: up to 10 points
   */
  private scoreProvider(provider: any, request: any): MatchCandidate {
    let score = 0;
    const reasons: string[] = [];

    // Category match (40 points)
    const hasCategory = provider.categories.some(
      (cat: any) => cat.categoryKey === request.categoryKey,
    );
    if (hasCategory) {
      score += 40;
      reasons.push('Category match');
    } else {
      // No category match = not eligible
      return { providerId: provider.id, score: 0, reasons: [] };
    }

    // Location matching
    if (request.city || request.countryCode) {
      const hasServiceArea = provider.serviceAreas.some((area: any) => {
        // City match (25 points)
        if (request.city && area.city === request.city) {
          score += 25;
          reasons.push('City match');
          return true;
        }
        
        // Country match (10 points)
        if (request.countryCode && area.countryCode === request.countryCode) {
          score += 10;
          reasons.push('Country match');
          return true;
        }

        // Region match (10 points)
        if (request.region && area.region === request.region) {
          score += 10;
          reasons.push('Region match');
          return true;
        }

        return false;
      });

      // If location specified but no service area match, reduce eligibility
      if (!hasServiceArea && provider.serviceAreas.length > 0) {
        score -= 10;
      }
    }

    // Verified provider (10 points)
    if (provider.isVerified) {
      score += 10;
      reasons.push('Verified provider');
    }

    // Tenant-backed provider (5 points)
    if (provider.tenantId && provider.tenant?.status === 'ACTIVE') {
      score += 5;
      reasons.push('Active tenant store');
    }

    // Rating bonus (up to 10 points)
    if (provider.averageRating) {
      const ratingScore = Math.min(10, (Number(provider.averageRating) / 5) * 10);
      score += ratingScore;
      if (ratingScore > 5) {
        reasons.push('High rating');
      }
    }

    return {
      providerId: provider.id,
      score,
      reasons,
    };
  }

  /**
   * Create a match record
   */
  private async createMatch(requestId: string, candidate: MatchCandidate) {
    return this.prisma.marketplaceMatch.create({
      data: {
        requestId,
        providerId: candidate.providerId,
        score: candidate.score,
        reasonSummary: candidate.reasons.join(' + '),
        status: 'MATCHED',
      },
    });
  }

  /**
   * Get matches for a provider
   */
  async getProviderMatches(
    providerId: string,
    filters: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { providerId };

    if (filters.status) {
      where.status = filters.status;
    }

    const [matches, total] = await Promise.all([
      this.prisma.marketplaceMatch.findMany({
        where,
        include: {
          request: {
            include: {
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceMatch.count({ where }),
    ]);

    return {
      matches,
      total,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    };
  }

  /**
   * Update match status
   */
  async updateMatchStatus(matchId: string, status: string) {
    return this.prisma.marketplaceMatch.update({
      where: { id: matchId },
      data: { status: status as any },
    });
  }

  /**
   * Mark match as viewed
   */
  async markMatchViewed(matchId: string) {
    return this.updateMatchStatus(matchId, 'VIEWED');
  }

  /**
   * Skip a match
   */
  async skipMatch(matchId: string) {
    return this.updateMatchStatus(matchId, 'SKIPPED');
  }
}
