-- 015_db_functions.sql
-- Application-specific DB functions and triggers

-- Update customer's outstanding balance when ledger_entries change
CREATE OR REPLACE FUNCTION public.update_customer_outstanding()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  total numeric := 0;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO total
  FROM public.ledger_entries
  WHERE customer_id = NEW.customer_id;

  UPDATE public.customers
  SET outstanding_balance = total
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$;

-- Trigger: call when ledger_entries inserted/updated/deleted
CREATE TRIGGER trg_update_customer_outstanding_after_insert
AFTER INSERT OR UPDATE ON public.ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.update_customer_outstanding();

-- Order inventory functions
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.inventory
  SET quantity = GREATEST(quantity - p_quantity, 0)
  WHERE product_id = p_product_id;
END;
$$;

-- Create ledger entry on invoice insert
CREATE OR REPLACE FUNCTION public.create_ledger_on_invoice()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.ledger_entries (id, customer_id, amount, entry_type, created_at, metadata)
  VALUES (gen_random_uuid(), NEW.customer_id, NEW.total_amount, 'invoice', now(), jsonb_build_object('invoice_id', NEW.id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_ledger_on_invoice
AFTER INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.create_ledger_on_invoice();

-- Release inventory on order cancel / return
CREATE OR REPLACE FUNCTION public.release_inventory_on_order_cancel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelled' THEN
    UPDATE public.inventory i
    SET quantity = quantity + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND i.product_id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_release_inventory_on_order_update
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.release_inventory_on_order_cancel();
