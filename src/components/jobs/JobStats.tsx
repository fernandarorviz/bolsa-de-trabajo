import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JobStatsProps {
  stats: {
    by_location: Record<string, number>;
    by_area: Record<string, number>;
  };
  onFilterChange: (type: 'ubicacion' | 'area', value: string) => void;
  selectedLocation: string;
  selectedArea: string;
}

export function JobStats({ stats, onFilterChange, selectedLocation, selectedArea }: JobStatsProps) {
  if (!stats) return null;

  const locations = Object.entries(stats.by_location || {}).sort((a, b) => a[0].localeCompare(b[0]));
  const areas = Object.entries(stats.by_area || {}).sort((a, b) => a[0].localeCompare(b[0]));

  if (locations.length === 0 && areas.length === 0) return null;

  return (
    <Card className="mb-8 border-t-4 border-t-primary">
      <CardHeader className="bg-slate-50/50 pb-4">
        <CardTitle className="text-lg font-semibold text-primary">Empleos disponibles</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {locations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">Estado</h3>
            <div className="flex flex-wrap gap-2">
              {locations.map(([location, count]) => (
                <Badge
                  key={location}
                  variant={selectedLocation === location ? "default" : "outline"}
                  className={`
                    cursor-pointer hover:bg-primary/90 hover:text-white transition-all text-sm py-1 px-3
                    ${selectedLocation === location ? 'shadow-md' : 'bg-white text-slate-700 hover:border-primary'}
                  `}
                  onClick={() => onFilterChange('ubicacion', selectedLocation === location ? 'todas' : location)}
                >
                  {location} <span className="ml-1 opacity-70">({count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {areas.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">Categoría</h3>
            <div className="flex flex-wrap gap-2">
              {areas.map(([area, count]) => (
                <Badge
                  key={area}
                  variant={selectedArea === area ? "default" : "outline"}
                  className={`
                    cursor-pointer hover:bg-primary/90 hover:text-white transition-all text-sm py-1 px-3
                    ${selectedArea === area ? 'shadow-md' : 'bg-white text-slate-700 hover:border-primary'}
                  `}
                  onClick={() => onFilterChange('area', selectedArea === area ? 'todas' : area)}
                >
                  {area} <span className="ml-1 opacity-70">({count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
