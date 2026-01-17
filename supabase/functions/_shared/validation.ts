/**
 * Shared validation and sanitization utilities for edge functions
 * These utilities help prevent injection attacks and ensure data integrity
 */

// Maximum lengths for various input types
export const MAX_LENGTHS = {
  email: 255,
  name: 100,
  message: 5000,
  password: 128,
  path: 500,
  userAgent: 500,
  referrer: 2000,
  base64Image: 10 * 1024 * 1024, // 10MB max for base64 images
  chatMessage: 10000,
  searchQuery: 200,
  token: 100,
  uuid: 36,
  planTier: 10,
  action: 50,
} as const;

// Valid plan tiers
export const VALID_PLAN_TIERS = ['basic', 'plus', 'pro'] as const;
export type PlanTier = typeof VALID_PLAN_TIERS[number];

// Valid admin actions
export const VALID_ADMIN_ACTIONS = [
  'reset_password',
  'update_plan',
  'toggle_status',
  'delete_user',
  'delete_user_by_email',
  'remove_plan',
  'reset_legacy_code'
] as const;
export type AdminAction = typeof VALID_ADMIN_ACTIONS[number];

/**
 * Validates email format
 */
export function validateEmail(email: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (trimmed.length > MAX_LENGTHS.email) {
    return { valid: false, error: `Email must be less than ${MAX_LENGTHS.email} characters` };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, sanitized: trimmed };
}

/**
 * Validates and sanitizes a string input
 */
export function sanitizeString(
  input: unknown, 
  maxLength: number, 
  fieldName: string = 'Input'
): { valid: boolean; sanitized?: string; error?: string } {
  if (input === null || input === undefined) {
    return { valid: true, sanitized: '' };
  }
  
  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  
  // Trim and limit length
  const sanitized = input.trim().slice(0, maxLength);
  
  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes a required string input
 */
export function sanitizeRequiredString(
  input: unknown, 
  maxLength: number, 
  fieldName: string = 'Input'
): { valid: boolean; sanitized?: string; error?: string } {
  const result = sanitizeString(input, maxLength, fieldName);
  
  if (!result.valid) return result;
  
  if (!result.sanitized || result.sanitized.length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  return result;
}

/**
 * Validates UUID format
 */
export function validateUUID(id: unknown, fieldName: string = 'ID'): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof id !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  
  const trimmed = id.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(trimmed)) {
    return { valid: false, error: `Invalid ${fieldName} format` };
  }
  
  return { valid: true, sanitized: trimmed.toLowerCase() };
}

/**
 * Validates plan tier
 */
export function validatePlanTier(tier: unknown): { valid: boolean; sanitized?: PlanTier; error?: string } {
  if (typeof tier !== 'string') {
    return { valid: false, error: 'Plan tier must be a string' };
  }
  
  const trimmed = tier.trim().toLowerCase();
  
  if (!VALID_PLAN_TIERS.includes(trimmed as PlanTier)) {
    return { valid: false, error: `Invalid plan tier. Must be one of: ${VALID_PLAN_TIERS.join(', ')}` };
  }
  
  return { valid: true, sanitized: trimmed as PlanTier };
}

/**
 * Validates admin action
 */
export function validateAdminAction(action: unknown): { valid: boolean; sanitized?: AdminAction; error?: string } {
  if (typeof action !== 'string') {
    return { valid: false, error: 'Action must be a string' };
  }
  
  const trimmed = action.trim().toLowerCase();
  
  if (!VALID_ADMIN_ACTIONS.includes(trimmed as AdminAction)) {
    return { valid: false, error: `Invalid action. Must be one of: ${VALID_ADMIN_ACTIONS.join(', ')}` };
  }
  
  return { valid: true, sanitized: trimmed as AdminAction };
}

/**
 * Validates base64 encoded image
 */
export function validateBase64Image(data: unknown): { valid: boolean; error?: string } {
  if (typeof data !== 'string') {
    return { valid: false, error: 'Image data must be a string' };
  }
  
  if (data.length === 0) {
    return { valid: false, error: 'Image data is required' };
  }
  
  if (data.length > MAX_LENGTHS.base64Image) {
    return { valid: false, error: 'Image is too large (max 10MB)' };
  }
  
  // Check if it's valid base64 (basic check)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(data)) {
    return { valid: false, error: 'Invalid base64 encoding' };
  }
  
  return { valid: true };
}

/**
 * Validates chat messages array
 */
export function validateChatMessages(
  messages: unknown
): { valid: boolean; sanitized?: Array<{ role: string; content: string }>; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }
  
  if (messages.length === 0) {
    return { valid: false, error: 'At least one message is required' };
  }
  
  if (messages.length > 50) {
    return { valid: false, error: 'Too many messages (max 50)' };
  }
  
  const sanitized: Array<{ role: string; content: string }> = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    if (typeof msg !== 'object' || msg === null) {
      return { valid: false, error: `Message ${i + 1} must be an object` };
    }
    
    const { role, content } = msg as { role?: unknown; content?: unknown };
    
    if (typeof role !== 'string' || !['user', 'assistant', 'system'].includes(role)) {
      return { valid: false, error: `Message ${i + 1} has invalid role` };
    }
    
    if (typeof content !== 'string') {
      return { valid: false, error: `Message ${i + 1} content must be a string` };
    }
    
    if (content.length > MAX_LENGTHS.chatMessage) {
      return { valid: false, error: `Message ${i + 1} is too long (max ${MAX_LENGTHS.chatMessage} characters)` };
    }
    
    sanitized.push({
      role,
      content: content.trim()
    });
  }
  
  return { valid: true, sanitized };
}

/**
 * Validates URL path for pageview tracking
 */
export function validatePath(path: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof path !== 'string') {
    return { valid: false, error: 'Path must be a string' };
  }
  
  let sanitized = path.trim().slice(0, MAX_LENGTHS.path);
  
  // Ensure path starts with /
  if (!sanitized.startsWith('/')) {
    sanitized = '/' + sanitized;
  }
  
  // Remove any potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"]/g, '');
  
  return { valid: true, sanitized };
}

/**
 * Validates password strength
 */
export function validatePassword(password: unknown): { valid: boolean; error?: string } {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  if (password.length > MAX_LENGTHS.password) {
    return { valid: false, error: `Password must be less than ${MAX_LENGTHS.password} characters` };
  }
  
  return { valid: true };
}

/**
 * Validates boolean input
 */
export function validateBoolean(value: unknown, fieldName: string = 'Value'): { valid: boolean; sanitized?: boolean; error?: string } {
  if (typeof value === 'boolean') {
    return { valid: true, sanitized: value };
  }
  
  if (value === 'true' || value === 1) {
    return { valid: true, sanitized: true };
  }
  
  if (value === 'false' || value === 0 || value === undefined || value === null) {
    return { valid: true, sanitized: false };
  }
  
  return { valid: false, error: `${fieldName} must be a boolean` };
}

/**
 * Validates expiration option
 */
export function validateExpirationOption(option: unknown): { valid: boolean; sanitized?: '7days' | '30days' | 'permanent'; error?: string } {
  if (option === undefined || option === null) {
    return { valid: true, sanitized: 'permanent' };
  }
  
  if (typeof option !== 'string') {
    return { valid: false, error: 'Expiration option must be a string' };
  }
  
  const validOptions = ['7days', '30days', 'permanent'];
  
  if (!validOptions.includes(option)) {
    return { valid: false, error: `Invalid expiration option. Must be one of: ${validOptions.join(', ')}` };
  }
  
  return { valid: true, sanitized: option as '7days' | '30days' | 'permanent' };
}

/**
 * Escapes HTML to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}
