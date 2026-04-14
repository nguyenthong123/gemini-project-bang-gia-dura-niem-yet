/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { PRICE_DATA } from './data/prices';
import { PriceTable } from './components/PriceTable';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Calendar, Info, Building2, TrendingUp, LogOut, UserCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function App() {
  const { user, isLoading, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(PRICE_DATA[0].id);

  const filteredData = useMemo(() => {
    return PRICE_DATA.map(category => ({
      ...category,
      products: category.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })).filter(category => category.products.length > 0);
  }, [searchTerm]);

  const totalProducts = useMemo(() => {
    return PRICE_DATA.reduce((acc, cat) => acc + cat.products.length, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="animate-pulse text-primary font-medium">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-primary/20">
      {/* Header Section */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  Công ty Cổ phần Hiệp Phú
                </h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Hệ thống tra cứu báo giá sản phẩm
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  Áp dụng từ: 07/04/2026
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Đăng xuất</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 border-none shadow-md bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Thông báo mới</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">Điều chỉnh bảng giá sản phẩm 2026</CardTitle>
              <CardDescription className="text-base">
                Cập nhật chi tiết giá mới cho các dòng tấm DURAflex, DURAwood và phụ kiện. 
                Vui lòng kiểm tra kỹ quy cách và mã sản phẩm trước khi đặt hàng.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tổng số sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{totalProducts}</span>
                <span className="text-sm text-muted-foreground">mặt hàng</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Mức tăng trung bình: 5% - 8%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
              className="pl-10 bg-white border-gray-200 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>Giá đã bao gồm thuế VAT</span>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-white border shadow-sm p-1 inline-flex w-auto">
              {PRICE_DATA.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2 rounded-md transition-all"
                >
                  {category.title.split('DURA')[0].trim() || category.title.split('®')[0].trim()}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {PRICE_DATA.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0 focus-visible:outline-none">
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-white border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-primary">{category.title}</CardTitle>
                      <CardDescription className="mt-1">{category.description}</CardDescription>
                    </div>
                    <FileText className="w-8 h-8 text-gray-200" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredData.find(c => c.id === category.id) ? (
                    <PriceTable products={filteredData.find(c => c.id === category.id)!.products} />
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">
                      Không tìm thấy sản phẩm nào khớp với từ khóa "{searchTerm}"
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <footer className="bg-white border-t py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-bold text-lg mb-2">Công ty Cổ phần Hiệp Phú</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Đơn vị sản xuất và cung cấp các giải pháp tấm xi măng sợi hàng đầu Việt Nam. 
                Sản phẩm DURAflex® Low Carbon cam kết bảo vệ môi trường và chất lượng bền vững.
              </p>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <p className="text-sm font-medium">Tài liệu lưu hành nội bộ</p>
              <p className="text-xs text-muted-foreground">© 2026 Hiệp Phú Corporation. All rights reserved.</p>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            DURAflex • DURAwood • DURAfiller • DURAvis
          </div>
        </div>
      </footer>
    </div>
  );
}
