import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function AdminLoginPage() {
  useDocumentTitle('تسجيل دخول الإدارة');
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

      navigate(location.state?.from || '/admin', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#124E3B] p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#E8E3D5] p-6 text-[#124E3B] shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#124E3B] text-[#FFD60A]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">لوحة إدارة VEXA</h1>
            <p className="text-xs text-[#124E3B]/70">دخول المشرفين فقط</p>
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
