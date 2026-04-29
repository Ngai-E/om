'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Users,
    UserCog,
    Shield,
    Package,
    Phone,
    ShoppingBag,
    FolderTree,
    BarChart3,
    Truck,
    Tag,
    Star,
    Video,
    DollarSign,
    Settings,
    Store,
    Globe,
    CreditCard,
    Upload,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    Search,
    Lock,
    Eye,
    Edit,
    Trash2,
    Plus,
    Filter,
    Download,
    Bell,
    Activity,
    TrendingUp,
    FileText,
    Palette,
    ArrowLeft,
    Printer,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
type Role = 'staff' | 'admin' | 'superadmin';

interface DocSection {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    steps?: string[];
    tips?: string[];
    notes?: string[];
    permissions?: 'all' | 'admin' | 'superadmin';
}

// ============================================================
// DATA
// ============================================================
const staffSections: DocSection[] = [
    {
        id: 'staff-dashboard',
        icon: BarChart3,
        title: 'Staff Dashboard',
        description: 'Your at-a-glance view of today\'s activity. Shows live counts of new orders, orders pending packing, and a quick timeline of recent customer updates.',
        steps: [
            'Navigate to Staff Portal → Dashboard.',
            'Review the "New Orders" counter — these need attention first.',
            'Use the "Pending Packing" count to prioritise fulfilment.',
            'Click any order in the Recent Activity list to open it instantly.',
        ],
        tips: ['The dashboard auto-refreshes every 30 seconds — no need to reload.'],
    },
    {
        id: 'staff-orders',
        icon: Package,
        title: 'Managing Orders',
        description: 'View and progress customer orders through the fulfilment workflow. Staff can update order status but cannot delete orders or change prices.',
        steps: [
            'Go to Staff Portal → Orders.',
            'Filter by status (New, Packed, Out for Delivery, Delivered) using the dropdown.',
            'Click an order card to open the detail view.',
            'Use the status buttons (e.g. "Mark as Packed", "Mark as Out for Delivery") to advance the order.',
            'Add an internal note using the Notes field — customers do not see these.',
            'Print the packing slip from the order detail page using the Print button.',
        ],
        tips: [
            'Orders highlighted in red have been waiting the longest — handle these first.',
            'You can bulk-advance multiple orders by checking the checkboxes and using the bulk action menu.',
        ],
        notes: ['Only Admins can cancel or refund an order.'],
    },
    {
        id: 'staff-phone-orders',
        icon: Phone,
        title: 'Taking Phone Orders',
        description: 'Quickly create an order on behalf of a customer who called in. The system auto-fills customer details if they already have an account.',
        steps: [
            'Go to Staff Portal → Phone Orders (or Admin → Phone Orders from the sidebar).',
            'Search for the customer by phone number or email in the search box.',
            'If the customer is new, fill in their name and phone number.',
            'Use the product search to add items to the order.',
            'Adjust quantities using the + / – buttons.',
            'Select the delivery address or enter a new one.',
            'Choose a delivery slot and payment method.',
            'Click "Place Order" — the customer receives an SMS/email confirmation automatically.',
        ],
        tips: ['Product search also supports scanning a barcode with a connected scanner.'],
    },
    {
        id: 'staff-customers',
        icon: Users,
        title: 'Viewing Customers',
        description: 'Look up a customer\'s order history and contact details. Available only if your Admin has granted you the Customers permission.',
        steps: [
            'Navigate to Customers from the sidebar (only visible if you have the permission).',
            'Search by name, email, or phone number.',
            'Click a customer row to view their full order history.',
            'Use the phone/email icons to contact them directly.',
        ],
        permissions: 'all',
        notes: ['Editing or deleting a customer account requires Admin role.'],
    },
    {
        id: 'staff-inventory',
        icon: BarChart3,
        title: 'Checking Inventory',
        description: 'View current stock levels and flag items that need restocking. Editing stock levels requires the Inventory permission granted by your Admin.',
        steps: [
            'Navigate to Inventory from the sidebar (visible with Inventory permission).',
            'Use the "Low Stock" filter to find items below their reorder threshold.',
            'Click a product row to adjust its stock count.',
            'Save, and the change is logged in the audit trail.',
        ],
        notes: ['Stock changes are tracked and attributed to your account in the Audit Log.'],
    },
];

const adminSections: DocSection[] = [
    {
        id: 'admin-dashboard',
        icon: TrendingUp,
        title: 'Admin Dashboard',
        description: 'High-level overview of store performance: revenue trends, order volumes, top products, and customer growth — all at a glance.',
        steps: [
            'Navigate to Admin → Dashboard.',
            'Use the date-range picker (top right) to switch between Today, This Week, and This Month.',
            'Click any metric card to drill into the underlying data.',
            'The "Recent Orders" table at the bottom links directly to each order for quick access.',
        ],
        tips: ['Revenue figures are updated in real time as orders are marked Delivered.'],
    },
    {
        id: 'admin-orders',
        icon: Package,
        title: 'Orders',
        description: 'Full control over all orders — view, filter, update status, apply refunds, and download reports.',
        steps: [
            'Go to Admin → Orders.',
            'Use the top filters: Status, Date Range, and the Search bar (accepts order ID, customer phone, or product name).',
            'Click an order to open the detail panel.',
            'From the detail panel you can: change status, add notes, trigger a refund, or cancel.',
            'To download a CSV export, click the Export button in the top toolbar.',
        ],
        tips: [
            'Sub-filter "Pending Payment" shows orders awaiting payment — follow up with customers here.',
            '"Today" filter auto-selects midnight-to-now for quick shift briefings.',
        ],
    },
    {
        id: 'admin-products',
        icon: ShoppingBag,
        title: 'Products',
        description: 'Create and manage your product catalogue — name, price, images, variants, and social proof counters.',
        steps: [
            'Go to Admin → Products.',
            'Click "Add Product" to create a new listing.',
            'Fill in Name, Description, Price, and Category.',
            'Upload images (drag-and-drop or click to browse — saved to ImgBB or Cloudinary based on platform settings).',
            'Add variants (e.g. Size, Weight) using the Variants tab.',
            'Set the "Order Count" field to seed the social proof badge (shown to shoppers).',
            'Toggle "In Stock" and publish with Save.',
        ],
        tips: [
            'Changes to price or stock are logged in the Audit Log.',
            'Use bulk-edit to update prices for multiple products at once.',
        ],
    },
    {
        id: 'admin-categories',
        icon: FolderTree,
        title: 'Categories',
        description: 'Organise products into a hierarchy. Categories appear in the storefront navigation and filter sidebar.',
        steps: [
            'Go to Admin → Categories.',
            'Click "Add Category" — give it a name and optionally assign a parent for sub-categories.',
            'Upload a category image (used for the storefront grid).',
            'Drag rows to reorder — the order here determines storefront display order.',
            'Click the pencil to rename or the trash icon to delete (products in this category are not deleted, they become uncategorised).',
        ],
    },
    {
        id: 'admin-inventory',
        icon: BarChart3,
        title: 'Inventory',
        description: 'Track stock levels, set low-stock thresholds so the sidebar badge lights up, and bulk-adjust quantities.',
        steps: [
            'Go to Admin → Inventory.',
            'Set the "Reorder Threshold" for each product — the sidebar badge shows a count of products below this threshold.',
            'Use the "Adjust Stock" button to add or remove units (e.g. after a delivery or a write-off).',
            'Each adjustment is tagged with a reason code for audit purposes.',
            'Click "Export CSV" to download a full stock report.',
        ],
        tips: ['The red badge on the Inventory sidebar link auto-updates every 30 seconds.'],
    },
    {
        id: 'admin-delivery',
        icon: Truck,
        title: 'Delivery Settings',
        description: 'Configure delivery zones, fees, time slots, and minimum order values. Changes take effect immediately on the storefront.',
        steps: [
            'Go to Admin → Delivery.',
            'Add or edit Delivery Zones (by postcode prefix or area).',
            'Set a fee or mark as free for each zone.',
            'Configure available delivery slots (days and time windows).',
            'Set the minimum basket value per zone if required.',
            'Save — shoppers in that zone will see the updated options at checkout.',
        ],
    },
    {
        id: 'admin-customers',
        icon: Users,
        title: 'Customers',
        description: 'View your full customer list, individual order histories, addresses, and account status.',
        steps: [
            'Go to Admin → Customers.',
            'Search by name, email, or phone.',
            'Click a customer to see their full order history, saved addresses, and account status.',
            'Deactivate an account from the detail view if needed (the customer can no longer log in).',
        ],
        notes: ['Permanently deleting a customer account also anonymises their order history. This is irreversible.'],
    },
    {
        id: 'admin-staff',
        icon: UserCog,
        title: 'Staff Accounts',
        description: 'Create and manage staff login accounts. Staff accounts have a restricted view — they cannot access admin-only areas.',
        steps: [
            'Go to Admin → Staff.',
            'Click "Add Staff Member" — enter their name, email, and a temporary password.',
            'Assign their Permission Set (see Staff Permissions below).',
            'Save — they receive a welcome email with login instructions.',
            'To deactivate a staff member (e.g. they left the company), click their row and toggle "Active" off.',
        ],
        permissions: 'admin',
    },
    {
        id: 'admin-staff-permissions',
        icon: Shield,
        title: 'Staff Permissions',
        description: 'Control exactly what each staff member can see and do. Create named permission sets and assign them to staff accounts.',
        steps: [
            'Go to Admin → Staff Permissions.',
            'Click "New Permission Set" and name it (e.g. "Warehouse Team").',
            'Toggle on the permissions you want to grant: Inventory, Customers, Phone Orders, etc.',
            'Save the set, then assign it to staff members from the Staff page.',
            'Changes take effect at the staff member\'s next login.',
        ],
        permissions: 'admin',
        tips: ['Keep at least one "Full Access" permission set for your senior staff.'],
    },
    {
        id: 'admin-promotions',
        icon: Tag,
        title: 'Promotions & Discount Codes',
        description: 'Create percentage or fixed-value discount codes, flash sales, free delivery thresholds, and "X people used this" social proof badges.',
        steps: [
            'Go to Admin → Promotions.',
            'Click "Create Promotion".',
            'Choose the discount type: Percentage, Fixed Amount, or Free Delivery.',
            'Set the code (e.g. SAVE10), start/end dates, and usage limit.',
            'Set "Usage Count" to seed the social proof badge (e.g. "450 people used this").',
            'Save and share the code with customers.',
        ],
        tips: ['Leave "Usage Limit" blank for unlimited uses.'],
    },
    {
        id: 'admin-reviews',
        icon: Star,
        title: 'Reviews',
        description: 'Moderate customer product reviews. Approve, reject, or flag reviews before they appear publicly on product pages.',
        steps: [
            'Go to Admin → Reviews.',
            'Pending reviews are shown first — these need moderation.',
            'Click a review to read it in full.',
            'Click Approve to publish, or Reject to hide it from the storefront.',
            'Add an internal note explaining your decision (for audit trail purposes).',
        ],
    },
    {
        id: 'admin-testimonials',
        icon: Video,
        title: 'Testimonials',
        description: 'Feature customer video or text testimonials on the homepage. Add, reorder, and activate/deactivate them at any time.',
        steps: [
            'Go to Admin → Testimonials.',
            'Click "Add Testimonial" and paste a video URL or enter a text quote.',
            'Fill in the customer name and optional photo.',
            'Toggle "Active" to show it on the homepage.',
            'Drag rows to change display order.',
        ],
    },
    {
        id: 'admin-payouts',
        icon: DollarSign,
        title: 'Payouts (Store Ledger)',
        description: 'View your store\'s accumulated balance from completed orders, and see a history of payouts processed by the platform operator.',
        steps: [
            'Go to Admin → Payouts.',
            'Your current available balance is shown at the top.',
            'The table below shows historical payouts with their amount, date, and status (Pending, Processing, Completed).',
            'Contact your platform operator to request a manual payout if needed.',
        ],
        notes: ['Payout scheduling (weekly, bi-weekly, monthly) is configured by the Super Admin.'],
    },
    {
        id: 'admin-settings',
        icon: Settings,
        title: 'Store Settings',
        description: 'Configure your store\'s branding (logo, colours), contact details, social proof settings, and notification preferences.',
        steps: [
            'Go to Admin → Settings.',
            'Under the Branding tab: upload your logo, set primary and secondary colours, and edit the homepage hero section.',
            'Under the General tab: update store name, email, phone, and description.',
            'Under the Social Proof tab: enable/disable badges and set inflation multipliers.',
            'Under the Notifications tab: choose which events trigger admin email alerts.',
            'Save each tab individually.',
        ],
        permissions: 'admin',
        tips: ['Branding changes appear on the storefront within seconds — no cache clearing needed.'],
    },
    {
        id: 'admin-audit-logs',
        icon: Activity,
        title: 'Audit Logs',
        description: 'A tamper-proof log of every admin and staff action — who changed what, and when. Essential for accountability.',
        steps: [
            'Go to Admin → Audit Logs.',
            'Use the filters: Actor (which user), Event Type, and Date Range.',
            'Each row shows the actor, the action taken, the affected record, and the timestamp.',
            'Click a row to see the full before/after diff of what changed.',
        ],
        permissions: 'admin',
        notes: ['Audit log entries cannot be edited or deleted — they are append-only.'],
    },
];

const superAdminSections: DocSection[] = [
    {
        id: 'sa-dashboard',
        icon: TrendingUp,
        title: 'Platform Dashboard',
        description: 'Bird\'s-eye view of the entire platform: total tenants, active stores, stores on trial, total orders across all stores, and total products.',
        steps: [
            'Navigate to Platform Console → Dashboard.',
            'The five stat cards give you a quick health check.',
            'The "Recent Tenants" table below shows the 5 newest stores with their order and product counts.',
            'Click any tenant name to open their detail page.',
        ],
    },
    {
        id: 'sa-tenants',
        icon: Store,
        title: 'Managing Tenants',
        description: 'Create new stores, view all tenants, change their status (Active / Suspended / Cancelled), and drill into each store\'s details.',
        steps: [
            'Go to Platform Console → Tenants.',
            'Use the search bar to find a tenant by name, slug, or email.',
            'Click "Create Tenant" to provision a new store manually (without them going through the signup flow).',
            'To suspend a misbehaving tenant, click the Ban icon — they lose storefront access immediately.',
            'To reactivate, click the Tick icon on a suspended tenant.',
            'Click the Eye icon to open the Tenant Detail page.',
        ],
        tips: ['Only Super Admins can permanently delete a tenant (the delete button on the detail page).'],
    },
    {
        id: 'sa-tenant-detail',
        icon: Eye,
        title: 'Tenant Detail Page',
        description: 'Deep view into an individual tenant: their store info, billing status, domain list, branding colours, active license, and usage counts.',
        steps: [
            'From the Tenants list, click the Eye icon on any row.',
            'Click "Edit Tenant" to update their name, email, phone, description, status, or billing status.',
            'The Domains section shows all configured domains — primary subdomain and any custom domains.',
            'The Branding section shows a live colour preview of their primary, secondary, and accent colours.',
            'The Usage sidebar counts users, products, orders, categories, and promotions for that store.',
            'The Active License card (if shown) displays their current package tier and status.',
        ],
    },
    {
        id: 'sa-settings-general',
        icon: Settings,
        title: 'Platform Settings — General',
        description: 'Configure the global platform settings that apply to all tenants: platform name, domain, subdomain suffix, trial period, maintenance mode, and feature flags.',
        steps: [
            'Go to Platform Console → Settings → General tab.',
            'Set "Platform Name" — shown on the signup page and marketing site.',
            'Set "Platform Domain" — the root domain (e.g. stores.yourplatform.com).',
            'Set "Subdomain Suffix" — appended to tenant slugs (e.g. my-store.stores.com).',
            'Toggle "Maintenance Mode" to take all storefronts offline temporarily.',
            'Set "Default Trial Period" in days (applied to all new signups).',
            'Toggle "Signup Enabled" to open or close self-serve tenant registration.',
            'Click "Save Changes" when done.',
        ],
        tips: ['Changing the Subdomain Suffix does not retroactively update existing tenant domains — only new ones.'],
    },
    {
        id: 'sa-settings-fees',
        icon: DollarSign,
        title: 'Platform Settings — Fees & Payouts',
        description: 'Set the platform commission fee, tax withholding, minimum payout threshold, and payout schedule that applies to all tenants.',
        steps: [
            'Go to Platform Console → Settings → Fees & Payouts tab.',
            'Set "Platform Fee (%)" — the percentage deducted from each tenant\'s completed orders.',
            'Set "Tax (%)" — withheld from payouts if applicable in your jurisdiction.',
            'Set "Minimum Payout (£)" — tenants must accumulate at least this balance before a payout.',
            'Set "Payout Schedule" — Daily, Weekly, Bi-weekly, or Monthly.',
            'Click "Save Fees".',
        ],
        notes: ['Fee changes apply to future payouts only — completed payouts are not retroactively adjusted.'],
    },
    {
        id: 'sa-settings-image',
        icon: Upload,
        title: 'Platform Settings — Image Upload',
        description: 'Choose which image hosting service all tenants use for product photos, logos, and category images.',
        steps: [
            'Go to Platform Console → Settings → Image Upload tab.',
            'Select "ImgBB" (free, no account required) or "Cloudinary" (requires a Cloudinary account).',
            'For ImgBB: paste your API key from api.imgbb.com.',
            'For Cloudinary: enter your Cloud Name, API Key, and API Secret from the Cloudinary console.',
            'Click "Save Configuration".',
        ],
        tips: ['ImgBB is the default and works out of the box — use Cloudinary for higher upload limits.'],
    },
    {
        id: 'sa-settings-stripe',
        icon: CreditCard,
        title: 'Platform Settings — Stripe',
        description: 'Configure the centralised Stripe account used for all tenant payment processing and platform payouts.',
        steps: [
            'Go to Platform Console → Settings → Stripe tab.',
            'Enter your Stripe "Publishable Key" (starts with pk_).',
            'Enter your Stripe "Secret Key" (starts with sk_) — this is encrypted at rest.',
            'Enter your "Webhook Secret" (starts with whsec_) from your Stripe dashboard.',
            'Optionally enter a "Connect Account ID" (starts with acct_) for Stripe Connect payouts.',
            'Click "Save Configuration".',
        ],
        notes: ['Secret Key and Webhook Secret are encrypted — they appear as *** after saving.'],
    },
    {
        id: 'sa-payouts',
        icon: DollarSign,
        title: 'Payouts Management',
        description: 'Process, track, and manage payouts to all tenant stores. See pending/processing/completed counts and the total paid out to date.',
        steps: [
            'Go to Platform Console → Payouts.',
            'The four stat cards show: Pending, Processing, Completed, and Total Paid Out.',
            'Use the Status filter and search bar to find specific payouts.',
            'Click the Eye icon on a payout to see the full financial breakdown (gross, platform fee, tax, net).',
            'Click the Arrow icon on a Pending payout to mark it as Processing.',
            'Click the Tick icon on a Processing payout to mark it as Completed (this deducts from the tenant\'s balance).',
            'To create a manual payout: click "Create Payout", select a tenant from the list (those with a positive balance are shown), and confirm.',
        ],
        tips: ['A payout can only be marked Complete once — this is irreversible.'],
    },
    {
        id: 'sa-signup',
        icon: Globe,
        title: 'Self-Serve Tenant Signup',
        description: 'Tenants can create their own store at /platform/signup without any Super Admin involvement.',
        steps: [
            'Direct new tenants to /platform/signup.',
            'They enter their store name, choose a URL slug (e.g. my-store → my-store.stores.com), and their personal details.',
            'The system auto-checks slug availability in real time.',
            'On submit, the platform instantly provisions: a Tenant record, default branding, a subdomain, and an admin user account.',
            'The new tenant is taken directly to their Admin Dashboard on a 14-day free trial.',
            'You can disable new signups at any time via Platform Settings → Signup Enabled = false.',
        ],
    },
];

// ============================================================
// COMPONENTS
// ============================================================
function RoleBadge({ role }: { role: Role }) {
    const styles: Record<Role, string> = {
        staff: 'bg-blue-100 text-blue-700 border border-blue-200',
        admin: 'bg-green-100 text-green-700 border border-green-200',
        superadmin: 'bg-purple-100 text-purple-700 border border-purple-200',
    };
    const labels: Record<Role, string> = {
        staff: 'Staff',
        admin: 'Admin',
        superadmin: 'Super Admin',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[role]}`}>
            {labels[role]}
        </span>
    );
}

function PermissionBadge({ perm }: { perm?: string }) {
    if (!perm || perm === 'all') return null;
    const map: Record<string, { label: string; color: string }> = {
        admin: { label: 'Admin only', color: 'text-green-700 bg-green-50 border border-green-200' },
        superadmin: { label: 'Super Admin only', color: 'text-purple-700 bg-purple-50 border border-purple-200' },
    };
    const info = map[perm];
    if (!info) return null;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
            <Lock className="w-3 h-3" />
            {info.label}
        </span>
    );
}

function SectionCard({ section }: { section: DocSection }) {
    const [open, setOpen] = useState(false);
    const Icon = section.icon;

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all">
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-left flex items-center gap-4 p-5"
            >
                <div className="shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{section.title}</span>
                        <PermissionBadge perm={section.permissions} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{section.description}</p>
                </div>
                <ChevronRight
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
                />
            </button>

            {open && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{section.description}</p>

                    {section.steps && section.steps.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Step-by-step</p>
                            <ol className="space-y-2">
                                {section.steps.map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="shrink-0 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {section.tips && section.tips.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                            {section.tips.map((tip, i) => (
                                <p key={i} className="text-sm text-blue-800 flex gap-2">
                                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                    <span>{tip}</span>
                                </p>
                            ))}
                        </div>
                    )}

                    {section.notes && section.notes.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                            {section.notes.map((note, i) => (
                                <p key={i} className="text-sm text-amber-800 flex gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                    <span>{note}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================
// ROLE TAB CONFIGS
// ============================================================
const roles: { id: Role; label: string; icon: React.ElementType; color: string; borderColor: string; sections: DocSection[]; description: string }[] = [
    {
        id: 'staff',
        label: 'Staff',
        icon: Users,
        color: 'bg-blue-600',
        borderColor: 'border-blue-600',
        sections: staffSections,
        description: 'Staff accounts have a focused view of the platform. They can process and advance orders, take phone orders, and — with the right permissions — view customers and manage inventory. They cannot access settings, pricing, or reports.',
    },
    {
        id: 'admin',
        label: 'Admin',
        icon: UserCog,
        color: 'bg-green-600',
        borderColor: 'border-green-600',
        sections: adminSections,
        description: 'Admins run the day-to-day store operations. They have full access to all order management, product catalogue, promotions, customer records, and staff management. They can also configure store branding, delivery zones, and settings.',
    },
    {
        id: 'superadmin',
        label: 'Super Admin',
        icon: Shield,
        color: 'bg-purple-600',
        borderColor: 'border-purple-600',
        sections: superAdminSections,
        description: 'Super Admins operate the entire platform. They can manage all tenant stores, configure global platform settings (fees, images, Stripe, subdomains), and process payouts. They access a separate Platform Console at /platform.',
    },
];

// ============================================================
// PAGE
// ============================================================
export default function DocsPage() {
    const [activeRole, setActiveRole] = useState<Role>('admin');
    const [search, setSearch] = useState('');

    const roleData = roles.find(r => r.id === activeRole)!;
    const filtered = search.trim()
        ? roleData.sections.filter(s =>
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase())
        )
        : roleData.sections;

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6 lg:p-8">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden mb-2">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Admin
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm"
                >
                    <Printer className="w-4 h-4" />
                    Save as PDF
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Platform Documentation</h1>
                        <p className="text-sm text-gray-500">Learn how to administer every feature based on your role</p>
                    </div>
                </div>
            </div>

            {/* Role Quick Reference */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                {roles.map(r => {
                    const Icon = r.icon;
                    return (
                        <button
                            key={r.id}
                            onClick={() => setActiveRole(r.id)}
                            className={`text-left p-4 rounded-xl border-2 transition-all ${activeRole === r.id
                                ? `${r.borderColor} bg-gray-50`
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className={`w-9 h-9 ${r.color} rounded-lg flex items-center justify-center mb-3`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="font-semibold text-gray-900">{r.label}</p>
                            <p className="text-xs text-gray-500 mt-1">{r.sections.length} sections</p>
                        </button>
                    );
                })}
            </div>

            {/* Role Description */}
            <div className={`rounded-xl border-l-4 ${roleData.borderColor} bg-white border border-gray-200 p-5`}>
                <div className="flex items-center gap-2 mb-1">
                    <RoleBadge role={activeRole} />
                    <span className="text-sm font-semibold text-gray-900">Role Overview</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{roleData.description}</p>
            </div>

            {/* Search */}
            <div className="relative print:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder={`Search ${roleData.label} documentation...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                />
            </div>

            {/* Sections */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No results for "{search}"</p>
                        <p className="text-sm">Try a different keyword</p>
                    </div>
                ) : (
                    filtered.map(section => (
                        <SectionCard key={section.id} section={section} />
                    ))
                )}
            </div>

            {/* Footer note */}
            <div className="text-center py-4 text-xs text-gray-400">
                Showing {filtered.length} of {roleData.sections.length} sections for the {roleData.label} role
            </div>
        </div>
    );
}
