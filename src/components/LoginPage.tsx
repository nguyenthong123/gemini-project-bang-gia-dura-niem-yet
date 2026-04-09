import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Lock, User, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = isRegister
        ? await register(email, password, name)
        : await login(email, password);

      if (!result.success && result.error) {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary/10 p-4 rounded-2xl mb-4">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Công ty Cổ phần Hiệp Phú</h1>
          <p className="text-sm text-muted-foreground mt-1">Hệ thống tra cứu báo giá sản phẩm</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập'}
            </CardTitle>
            <CardDescription>
              {isRegister
                ? 'Nhập thông tin để tạo tài khoản'
                : 'Đăng nhập bằng email để tra cứu bảng giá'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isRegister}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isRegister ? 'Tối thiểu 6 ký tự' : '••••••••'}
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isRegister ? 6 : undefined}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  isRegister ? 'Đăng ký' : 'Đăng nhập'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-sm text-primary hover:underline font-medium"
                disabled={isSubmitting}
              >
                {isRegister
                  ? 'Đã có tài khoản? Đăng nhập'
                  : 'Chưa có tài khoản? Đăng ký ngay'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Hiệp Phú Corporation. All rights reserved.
        </p>
      </div>
    </div>
  );
}
