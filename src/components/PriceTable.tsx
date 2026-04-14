import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Product } from '@/src/types';
import { formatNumber } from '@/src/lib/format';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon } from 'lucide-react';

interface PriceTableProps {
  products: Product[];
}

export const PriceTable: React.FC<PriceTableProps> = ({ products }) => {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[80px] text-center">STT</TableHead>
            <TableHead>Tên hàng / Mã sản phẩm</TableHead>
            <TableHead className="text-center">Quy cách (mm)</TableHead>
            <TableHead className="text-center">Độ dày (mm)</TableHead>
            <TableHead className="text-center">ĐVT</TableHead>
            <TableHead className="text-right">Giá cũ (Sau VAT)</TableHead>
            <TableHead className="text-right font-bold text-primary">Giá mới (Sau VAT)</TableHead>
            <TableHead className="text-right">Chênh lệch</TableHead>
            <TableHead className="text-center">Tỉ lệ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="text-center font-mono text-xs text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{product.name}</span>
                  {product.code && (
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      {product.code}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center text-sm">{product.spec}</TableCell>
              <TableCell className="text-center text-sm">{product.thickness}</TableCell>
              <TableCell className="text-center text-sm">{product.unit}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatNumber(product.oldPrice)}
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                {formatNumber(product.newPrice)}
              </TableCell>
              <TableCell className="text-right text-sm text-green-600 font-medium">
                +{formatNumber(product.diff)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 font-mono text-[10px]">
                  <ArrowUpIcon className="w-2 h-2" />
                  {product.increaseRate}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
