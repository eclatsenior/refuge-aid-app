import { useState } from "react";
import { Phone, ExternalLink, Heart, MapPin, Search, Star, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  category: string;
  phone?: string;
  url?: string;
  region: string;
  description: string;
  isVerified: boolean;
  available24h: boolean;
}

const resources: Resource[] = [
  {
    id: '1',
    title: 'Teléfono Nacional contra la Violencia de Género',
    category: 'emergencia',
    phone: '016',
    region: 'nacional',
    description: 'Atención telefónica gratuita y confidencial 24 horas. No deja rastro en la factura.',
    isVerified: true,
    available24h: true
  },
  {
    id: '2',
    title: 'Emergencias - Policía Nacional',
    category: 'emergencia',
    phone: '112',
    region: 'nacional',
    description: 'Número de emergencias europeo. Disponible 24/7 para situaciones de peligro inmediato.',
    isVerified: true,
    available24h: true
  },
  {
    id: '3',
    title: 'Fundación ANAR - Ayuda a Niños y Adolescentes',
    category: 'apoyo',
    phone: '900202010',
    region: 'nacional',
    description: 'Atención especializada para menores en situación de riesgo.',
    isVerified: true,
    available24h: true
  },
  {
    id: '4',
    title: 'Delegación del Gobierno contra la Violencia de Género',
    category: 'informacion',
    url: 'https://violenciagenero.igualdad.gob.es/',
    region: 'nacional',
    description: 'Información oficial, recursos y guías para víctimas de violencia de género.',
    isVerified: true,
    available24h: false
  },
  {
    id: '5',
    title: 'Casa de Acogida - Madrid',
    category: 'alojamiento',
    phone: '914804901',
    region: 'madrid',
    description: 'Alojamiento temporal y protegido para víctimas y sus hijos.',
    isVerified: true,
    available24h: false
  },
  {
    id: '6',
    title: 'SAREEMHO - Cataluña',
    category: 'apoyo',
    phone: '900900120',
    region: 'cataluña',
    description: 'Servicio de atención, recuperación y acogida de emergencia.',
    isVerified: true,
    available24h: true
  },
  {
    id: '7',
    title: 'Instituto Andaluz de la Mujer',
    category: 'apoyo',
    phone: '900200999',
    region: 'andalucia',
    description: 'Atención psicológica y jurídica especializada.',
    isVerified: true,
    available24h: false
  }
];

const categories = [
  { value: 'todos', label: 'Todas las categorías' },
  { value: 'emergencia', label: 'Emergencias' },
  { value: 'apoyo', label: 'Apoyo y atención' },
  { value: 'alojamiento', label: 'Alojamiento' },
  { value: 'informacion', label: 'Información' }
];

const regions = [
  { value: 'todas', label: 'Todas las regiones' },
  { value: 'nacional', label: 'Nacional' },
  { value: 'madrid', label: 'Madrid' },
  { value: 'cataluña', label: 'Cataluña' },
  { value: 'andalucia', label: 'Andalucía' },
  { value: 'valencia', label: 'Valencia' },
  { value: 'galicia', label: 'Galicia' },
  { value: 'pais-vasco', label: 'País Vasco' }
];

export function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedRegion, setSelectedRegion] = useState("todas");
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || resource.category === selectedCategory;
    const matchesRegion = selectedRegion === 'todas' || resource.region === selectedRegion;
    
    return matchesSearch && matchesCategory && matchesRegion;
  });
  
  const handleCall = (phone: string, title: string) => {
    if (confirm(`¿Deseas llamar a ${title}?\nNúmero: ${phone}`)) {
      window.open(`tel:${phone}`);
      toast({
        title: "Abriendo marcador",
        description: `Llamando a ${phone}`
      });
    }
  };
  
  const handleOpenUrl = (url: string, title: string) => {
    window.open(url, '_blank');
    toast({
      title: "Abriendo enlace",
      description: `Accediendo a ${title}`
    });
  };
  
  const handleCopyInfo = (resource: Resource) => {
    const info = `${resource.title}\n${resource.phone ? `Tel: ${resource.phone}\n` : ''}${resource.url ? `Web: ${resource.url}\n` : ''}${resource.description}`;
    navigator.clipboard.writeText(info);
    toast({
      title: "Información copiada",
      description: "Puedes pegar esta información donde necesites"
    });
  };
  
  const toggleFavorite = (resourceId: string) => {
    setFavorites(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'emergencia':
        return 'bg-emergency/10 text-emergency border-emergency/20';
      case 'apoyo':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'alojamiento':
        return 'bg-safe/10 text-safe border-safe/20';
      case 'informacion':
        return 'bg-accent/10 text-accent-foreground border-accent/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };
  
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Recursos de Apoyo</h1>
        <p className="text-muted-foreground">
          Encuentra ayuda profesional y servicios especializados
        </p>
      </header>
      
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent>
              {regions.map(region => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron recursos</h3>
          <p className="text-muted-foreground">
            Prueba con otros filtros o términos de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResources
            .sort((a, b) => {
              // Emergency resources first, then favorites, then by verification status
              if (a.category === 'emergencia' && b.category !== 'emergencia') return -1;
              if (a.category !== 'emergencia' && b.category === 'emergencia') return 1;
              if (favorites.includes(a.id) && !favorites.includes(b.id)) return -1;
              if (!favorites.includes(a.id) && favorites.includes(b.id)) return 1;
              if (a.isVerified && !b.isVerified) return -1;
              if (!a.isVerified && b.isVerified) return 1;
              return a.title.localeCompare(b.title);
            })
            .map((resource) => (
              <Card 
                key={resource.id} 
                className={`hover:shadow-soft transition-shadow ${
                  resource.category === 'emergencia' ? 'border-emergency/30 bg-emergency/5' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-base line-clamp-2">
                          {resource.title}
                        </CardTitle>
                        {resource.isVerified && (
                          <Badge variant="secondary" className="text-xs bg-safe/10 text-safe border-safe/20">
                            ✓ Verificado
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${getCategoryColor(resource.category)}`}>
                          {getCategoryLabel(resource.category)}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs capitalize">
                          {resource.region}
                        </Badge>
                        
                        {resource.available24h && (
                          <Badge variant="secondary" className="text-xs">
                            24h
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(resource.id)}
                      className={favorites.includes(resource.id) ? 'text-warning' : 'text-muted-foreground'}
                    >
                      <Star 
                        size={16} 
                        className={favorites.includes(resource.id) ? 'fill-current' : ''} 
                      />
                    </Button>
                  </div>
                  
                  <CardDescription className="leading-relaxed">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex gap-2 flex-wrap">
                    {resource.phone && (
                      <Button
                        onClick={() => handleCall(resource.phone!, resource.title)}
                        size="sm"
                        className={resource.category === 'emergencia' 
                          ? 'bg-emergency hover:bg-emergency/90 text-emergency-foreground' 
                          : ''
                        }
                      >
                        <Phone size={14} className="mr-1" />
                        {resource.phone}
                      </Button>
                    )}
                    
                    {resource.url && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenUrl(resource.url!, resource.title)}
                        size="sm"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Web
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      onClick={() => handleCopyInfo(resource)}
                      size="sm"
                    >
                      <Copy size={14} className="mr-1" />
                      Copiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">Recuerda</p>
            <p className="text-sm text-muted-foreground">
              En caso de emergencia inmediata, llama al <strong>112</strong> o al <strong>016</strong>. 
              Estos números no aparecen en la factura telefónica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}