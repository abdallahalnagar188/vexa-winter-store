import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { sanitizeAdminRedirect } from '@/shared/validation/url';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { BrandLogo } from '@/shared/components/ui/BrandLogo';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function AdminLoginPage() {
  useDocumentTitle('تسجيل دخول الإدارة', { noIndex: true });
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }

      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error('هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة');
        return;
      }

      navigate(sanitizeAdminRedirect(location.state?.from, '/admin'), { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F2EC] p-4">
      <div className="w-full max-w-md rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-6 text-[#132238] shadow-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-[#132238]/10 pb-4">
          <div>
            <h1 className="sr-only">تسجيل دخول الإدارة</h1>
            <BrandLogo variant="light-bg" className="h-8 w-auto" />
            <p className="mt-1.5 text-xs font-semibold text-[#132238]/70">دخول المشرفين فقط</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#132238] text-[#FF6B1A]">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="البريد الإلكتروني"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="كلمة المرور"
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            دخول
          </Button>
        </form>
      </div>
    </div>
  );
}
