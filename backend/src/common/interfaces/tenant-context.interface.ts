/**
 * Tenant context attached to request after resolution
 */
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  status: string;
  onboardingStatus: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

/**
 * Extended Express Request with tenant context
 */
export interface RequestWithTenant extends Request {
  tenant: TenantContext;
  tenantId: string;
}
