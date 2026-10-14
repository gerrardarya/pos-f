export type Role = "admin" | "staff";
export type InvoiceStatus = "draft" | "completed";
export type PaymentMethod = "cash" | "other";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          role: Role;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: Role;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          barcode: string | null;
          base_unit: string;
          unit_price: number;
          stock_qty: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          barcode?: string | null;
          base_unit: string;
          unit_price: number;
          stock_qty?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          barcode?: string | null;
          base_unit?: string;
          unit_price?: number;
          stock_qty?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_units: {
        Row: {
          id: string;
          product_id: string;
          unit_name: string;
          qty_in_base: number;
          price: number;
          barcode: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          unit_name: string;
          qty_in_base: number;
          price: number;
          barcode?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          unit_name?: string;
          qty_in_base?: number;
          price?: number;
          barcode?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stock_adjustments: {
        Row: {
          id: string;
          product_id: string;
          change_qty: number;
          reason: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          change_qty: number;
          reason: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          change_qty?: number;
          reason?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string | null;
          name: string;
          status: InvoiceStatus;
          payment_method: PaymentMethod | null;
          amount_tendered: number | null;
          change_due: number | null;
          subtotal: number;
          total: number;
          created_by: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_number?: string | null;
          name: string;
          status?: InvoiceStatus;
          payment_method?: PaymentMethod | null;
          amount_tendered?: number | null;
          change_due?: number | null;
          subtotal?: number;
          total?: number;
          created_by: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          invoice_number?: string | null;
          name?: string;
          status?: InvoiceStatus;
          payment_method?: PaymentMethod | null;
          amount_tendered?: number | null;
          change_due?: number | null;
          subtotal?: number;
          total?: number;
          created_by?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          unit_sold: string;
          qty: number;
          base_unit_qty: number;
          original_price: number;
          final_price: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          unit_sold: string;
          qty: number;
          base_unit_qty: number;
          original_price: number;
          final_price: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          product_id?: string | null;
          product_name_snapshot?: string;
          unit_sold?: string;
          qty?: number;
          base_unit_qty?: number;
          original_price?: number;
          final_price?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
      next_invoice_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      complete_invoice: {
        Args: {
          p_invoice_id: string;
          p_payment_method: PaymentMethod;
          p_amount_tendered: number | null;
        };
        Returns: void;
      };
      adjust_stock: {
        Args: {
          p_product_id: string;
          p_change_qty: number;
          p_reason: string;
        };
        Returns: void;
      };
    };
  };
};
