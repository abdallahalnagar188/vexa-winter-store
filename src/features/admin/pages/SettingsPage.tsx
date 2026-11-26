import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminSettings, useSaveSetting } from '@/features/admin/api/useAdminSettings';
import { buildCourierMessage } from '@/shared/constants/orderStatus';
import { supabase } from '@/lib/supabase';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

export function SettingsPage() {
  useDocumentTitle('الإعدادات - الإدارة');
  const settingsQuery = useAdminSettings();
  const saveSetting = useSaveSetting();

  const [whatsapp, setWhatsapp] = useState('');
  const [lowStock, setLowStock] = useState(3);
  const [courierTemplate, setCourierTemplate] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (settingsQuery.data) {
      setWhatsapp(settingsQuery.data.whatsapp_number);
      setLowStock(settingsQuery.data.low_stock_threshold);
      setCourierTemplate(settingsQuery.data.courier_template);
    }
  }, [settingsQuery.data]);

  const handleSave = async () => {
    try {
      await Promise.all([
        saveSetting.mutateAsync({ key: 'whatsapp_number', value: whatsapp.trim(), isPublic: true }),
        saveSetting.mutateAsync({ key: 'low_stock_threshold', value: lowStock, isPublic: false }),
        saveSetting.mutateAsync({ key: 'courier_template', value: courierTemplate, isPublic: false }),
      ]);
      toast.success('تم حفظ الإعدادات');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      setNewPassword('');
      toast.success('تم تحديث كلمة المرور');
    }
  };

  const previewText = buildCourierMessage(
    {
      id: 'sample',
      order_ref: 'WNT-482913',
      status: 'new',
      customer_name: 'أحمد محمد',
      phone: '01012345678',
      phone_secondary: '01198765432',
      governorate_id: 1,
      governorate_name: 'القاهرة',
      city_area: 'مدينة نصر',
      address_details: 'شارع عباس العقاد، عمارة 14، الدور 3',
      notes: 'الاتصال قبل الوصول',
      internal_notes: null,
      subtotal_original: 2300,
      discount_total: 230,
      shipping_fee: 60,
      total_cod: 2130,
      stock_restocked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_items: [
        {
          id: '1',
          order_id: 'sample',
          product_id: null,
          variant_id: null,
          product_title: 'هودي أوفر سايز قطن ثقيل',
          size: 'L',
          color: 'زمردي داكن',
          image_url: null,
          unit_price: 1150,
          quantity: 2,
          line_original: 2300,
          line_discount: 230,
          line_total: 2070,
          tier_min_qty: 2,
        },
      ],
    },
    courierTemplate,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#124E3B]">إعدادات المتجر</h1>
        <Button variant="primary" onClick={handleSave} loading={saveSetting.isPending}>
          <Save className="h-4 w-4" />
          <span>حفظ الإعدادات</span>
        </Button>
      </div>

      <div className="grid gap-4 rounded-2xl bg-[#E8E3D5] p-5 shadow-sm sm:grid-cols-2">
        <Input
          label="رقم الواتساب (بالصيغة الدولية مثال: 201001234567)"
          dir="ltr"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
        <Input
          label="حد تنبيه انخفاض المخزون"
          type="number"
          min={1}
          value={lowStock}
          onChange={(e) => setLowStock(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>

      <div className="grid gap-4 rounded-2xl bg-[#E8E3D5] p-5 shadow-sm lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-extrabold">قالب رسالة المندوب (Copy for Courier)</label>
          <p className="text-[11px] text-[#124E3B]/75">
            المتغيرات: {'{name} {phone} {phone2_line} {governorate} {city_area} {address} {items} {total} {ref} {notes_line}'}
          </p>
          <textarea
            rows={9}
            value={courierTemplate}
            onChange={(e) => setCourierTemplate(e.target.value)}
            className="w-full rounded-xl border border-[#124E3B]/20 bg-[#F2EFE6] p-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <span className="text-sm font-extrabold">معاينة مباشرة</span>
          <pre className="whitespace-pre-wrap rounded-xl bg-[#F2EFE6] p-4 font-sans text-xs leading-relaxed">
            {previewText}
          </pre>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl bg-[#E8E3D5] p-5 shadow-sm">
        <h2 className="text-base font-extrabold">تغيير كلمة مرور المشرف</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            dir="ltr"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button variant="secondary" onClick={handlePasswordChange}>
            تحديث كلمة المرور
          </Button>
        </div>
      </div>
    </div>
  );
}
