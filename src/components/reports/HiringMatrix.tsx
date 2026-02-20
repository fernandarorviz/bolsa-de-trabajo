import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface HiringMatrixProps {
  data: {
    id: string;
    name: string;
    months: number[];
    total: number;
  }[];
  year: number;
  loading?: boolean;
  title?: string;
  firstColumnLabel?: string;
}

export function HiringMatrix({ 
  data, 
  year, 
  loading, 
  title = "CONTRATACIONES", 
  firstColumnLabel = "CLIENTE" 
}: HiringMatrixProps) {
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  // Calculate monthly totals
  const monthlyTotals = new Array(12).fill(0);
  let grandTotal = 0;

  data.forEach(item => {
    grandTotal += item.total;
    item.months.forEach((count, idx) => {
      monthlyTotals[idx] += count;
    });
  });

  if (loading) {
     return (
      <Card>
        <CardHeader>
           <CardTitle className="text-lg font-medium">{title} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
     )
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground py-3">
        <CardTitle className="text-lg font-medium">{title.toUpperCase()} {year}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow className="bg-blue-50 hover:bg-blue-50">
                    <TableHead className="w-[200px] font-bold text-gray-900 sticky left-0 bg-blue-50">
                        {firstColumnLabel.toUpperCase()}
                    </TableHead>
                    {months.map((m, i) => (
                        <TableHead key={i} className="text-center font-semibold text-gray-700 w-12">{i + 1}</TableHead>
                    ))}
                    <TableHead className="text-center font-bold text-gray-900 bg-blue-100">Suma total</TableHead>
                    <TableHead className="text-center font-bold text-gray-900 bg-blue-50">%</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="font-medium text-gray-900 sticky left-0 bg-white border-r">
                            {item.name}
                        </TableCell>
                         {item.months.map((count, idx) => (
                            <TableCell key={idx} className="text-center p-2">
                                {count > 0 ? count : ''}
                            </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-gray-50 border-x">
                            {item.total}
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-600 bg-blue-50/30">
                             {grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(2) : 0}%
                        </TableCell>
                    </TableRow>
                ))}
                
                 {/* Totals Row */}
                 <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-200">
                    <TableCell className="sticky left-0 bg-gray-100 border-r">TOTAL</TableCell>
                    {monthlyTotals.map((total, idx) => (
                        <TableCell key={idx} className="text-center">{total > 0 ? total : ''}</TableCell>
                    ))}
                    <TableCell className="text-center bg-gray-200">{grandTotal}</TableCell>
                    <TableCell className="text-center">100%</TableCell>
                </TableRow>
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
