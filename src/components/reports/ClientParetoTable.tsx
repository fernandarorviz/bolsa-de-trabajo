import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ClientParetoTableProps {
  data: {
    id: string;
    name: string;
    count: number;
    percentage: number;
    cumulativePercentage: number;
  }[];
  year: number;
  loading?: boolean;
}

export function ClientParetoTable({ data, year, loading }: ClientParetoTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
           <CardTitle className="text-lg font-medium">80/20 Contrataciones {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const grandTotal = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="w-full h-full">
      <CardHeader className="bg-primary text-primary-foreground py-3">
        <CardTitle className="text-lg font-medium">80/20 CONTRATACIONES {year}</CardTitle>
      </CardHeader>
       <CardContent className="p-0">
         <Table>
            <TableHeader>
                <TableRow className="bg-blue-50 hover:bg-blue-50">
                    <TableHead className="font-bold text-gray-900">CLIENTE</TableHead>
                    <TableHead className="text-center font-bold text-gray-900 w-24">SUM de Total</TableHead>
                    <TableHead className="text-center font-bold text-gray-900 w-24">SUM de %</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((client) => {
                    // Highlight 80% contributors
                    const isTopContributor = client.cumulativePercentage <= 80 || (client.cumulativePercentage - client.percentage < 80);

                    return (
                    <TableRow 
                        key={client.id} 
                        className={`hover:bg-gray-50 text-xs ${isTopContributor ? 'bg-blue-50/30' : ''}`}
                    >
                        <TableCell className="font-medium text-gray-900">
                            {client.name}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                            {client.count}
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                             {client.percentage.toFixed(2)}%
                        </TableCell>
                    </TableRow>
                )})}
                 <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-200">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{grandTotal}</TableCell>
                    <TableCell className="text-center">100%</TableCell>
                </TableRow>
            </TableBody>
         </Table>
       </CardContent>
    </Card>
  );
}
