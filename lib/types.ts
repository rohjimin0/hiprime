export interface Category {
  cat_id: number
  cat_name: string
  parent_id: number | null
  sort_order: number
}

export interface Product {
  product_id: number
  cat_id: number
  brand: string
  model_name: string
  storage: string
  color: string | null
  is_active: number
}

export interface PricingRule {
  rule_id: number
  product_id: number
  grade: 'S' | 'A' | 'B' | 'C'
  base_price: number
  valid_from: string | null
  valid_to: string | null
  updated_by: string | null
  updated_at: string
}

export interface Component {
  comp_id: number
  product_id: number | null
  comp_type: string
  deduct_amount: number
  description: string | null
}

export interface DealRequest {
  request_id: number
  product_id: number
  grade: string
  final_price: number
  selected_components: string | null
  contact: string | null
  method: 'visit' | 'shipping' | null
  status: string
  created_at: string
}

export interface AuditLog {
  log_id: number
  action: string
  target_table: string | null
  target_id: number | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
}

export interface QuoteRequest {
  product_id: number
  grade: 'S' | 'A' | 'B' | 'C'
  selected_component_ids: number[]
}

export interface QuoteResult {
  product: Product
  grade: string
  base_price: number
  deductions: { comp: Component; selected: boolean }[]
  total_deduction: number
  final_price: number
}
